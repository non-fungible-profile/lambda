// @ts-ignore
import axios from 'axios';
import {
  getProposalsAuthoredByAddress,
  getSpacesAddressIsMemberIn,
  getVotesCastedByAddress,
  Proposal,
  Space,
  Vote,
} from './sources/snapshot';

export const VOTE_WEIGHT = 69;
export const PROPOSAL_WEIGHT = 420;

export async function queryNonFungibleProfileSubgraph<T = any>(query: string) {
  const { data } = await axios.post<T>(process.env.SNAPSHOT_GRAPHQL_ENDPOINT as string, {
    query,
  });

  return data;
}

export interface Token {
  tokenId: string;
  owner: string;
}

export interface FetchTokenResponse {
  data: {
    token: {
      tokenId: string;
      owner: string;
    };
  };
}

export async function getToken(tokenId: string): Promise<Token> {
  // Query the current owner from subgraph
  const { data } = await queryNonFungibleProfileSubgraph<FetchTokenResponse>(`
      token (where: {
        tokenId: "${tokenId}"
      }) {
        tokenId
        owner
      }`);

  return data.token;
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