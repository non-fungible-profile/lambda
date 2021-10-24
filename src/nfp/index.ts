// @ts-ignore
import axios from 'axios';
import {
  getProposalsAuthoredByAddress,
  getSpacesAddressIsMemberIn,
  getVotesCastedByAddress,
  Proposal,
  Space,
  Vote,
} from '../sources/snapshot';

export const VOTE_WEIGHT = 69;
export const PROPOSAL_WEIGHT = 420;

export async function queryNonFungibleProfileSubgraph<T = any>(query: string) {
  const { data } = await axios.post<T>(process.env.SUBGRAPH_ENDPOINT as string, {
    query,
  });

  return data;
}

export interface TokenForeground {
  tokenId: string;
  tokenAddress: string;
}
export interface Token {
  tokenId: string;
  owner: {
    id: string;
  };
  foreground: TokenForeground;
  contract: string;
}

export interface FetchTokenResponse {
  data: {
    token: Token;
  };
}

export async function getToken(tokenId: number): Promise<Token> {
  const tokenIdHexString = `0x${Number(tokenId).toString(16)}`;
  console.log({ tokenIdHexString });
  // Query the current owner from subgraph
  const res = await queryNonFungibleProfileSubgraph<FetchTokenResponse>(`
    {
      token(id: "${tokenIdHexString}") {
        id
        owner {
          id
        }
        uri
        foreground {
          id
          tokenAddress
        }
      }
    }`);

  console.log(JSON.stringify(res, null, 2));

  return res.data.token;
}

export interface CalculateResponseScore {
  score: number;
  metrics: {
    spaces: Space[];
    proposals: Proposal[];
    votes: Vote[];
  };
}

/**
 * Calculate an EOA address score
 *
 * Metrics
 * 1. Voted on a proposal `1`
 * 2. Created a proposal `2`
 * @param address
 */
export async function calculateAddressScore(address: string): Promise<CalculateResponseScore> {
  let score = 0;
  // Get spaces, proposals, and votes
  const spaces = await getSpacesAddressIsMemberIn(address);
  const proposals = await getProposalsAuthoredByAddress(address);
  const votes = await getVotesCastedByAddress(address);
  // If the user is a member of any space
  if (spaces.length > 0) {
    // WIP
    const votesScore = votes.length * VOTE_WEIGHT;
    const proposalsScore = proposals.length * PROPOSAL_WEIGHT;
    score = votesScore + proposalsScore;
  }
  // the address does not belong to any space
  // just use their proposals and their votes
  else {
    const votesScore = votes.length * VOTE_WEIGHT;
    const proposalsScore = proposals.length * PROPOSAL_WEIGHT;
    score = votesScore + proposalsScore;
  }
  // Return results
  return {
    score,
    metrics: {
      spaces,
      proposals,
      votes,
    },
  };
}
