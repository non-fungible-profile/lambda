import axios from 'axios';
import { getLogger } from 'log4js';

export const logger = getLogger('snapshot');

export interface GraphQLResponse<ReturnType> {
  data: ReturnType;
}

export interface Space {
  members: string[];
  name: string;
  id: string;
  private: boolean;
  about: string;
  avatar: string;
  terms: string;
  location: string;
  website: string;
  twitter: string;
  github: string;
  email: string;
  network: string;
  symbol: string;
  skin: string;
  domain: string;
  admins: string[];
}

export type QueryAllSpaces = GraphQLResponse<{
  spaces: Space[];
}>;

/**
 * Queries a given subgraph
 * @param query
 * @returns
 */
export async function querySnapshotGraph<T = any>(query: string) {
  const { data } = await axios.post<T>(process.env.SNAPSHOT_GRAPHQL_ENDPOINT as string, {
    query,
  });

  return data;
}

/**
 * Returns all spaces the address is member in
 * @param address the address
 * @returns
 */
export async function getSpacesAddressIsMemberIn(address: string): Promise<Space[]> {
  logger.info(`Getting spaces`);
  const { data } = await querySnapshotGraph<QueryAllSpaces>(`{
        spaces(first: 100000, skip: 0) {
          members
          name
          id
          private
          about
          avatar
          terms
          location
          website
          twitter
          github
          email
          network
          symbol
          skin
          domain
          admins
        }
      }`);

  logger.info(`Found ${data.spaces.length} spaces`);

  const spacesAddressIsMemberIn = data.spaces.filter(space => {
    const isMember = space.members.includes(address);
    logger.debug(`Spaces ${space.name} (${space.id}) includes ${address} | ${isMember}`);
    return isMember;
  });

  return spacesAddressIsMemberIn;
}

export interface SpaceWithinProposal {}

export interface Proposal {
  id: string;
  ipfs: string;
  author: string;
  created: number;
  space: {
    id: string;
    name: string;
  };
  network: string;
  type: string;
  title: string;
  body: string;
  choices: string;
  start: number;
  end: number;
  snapshot: string;
  state: string;
  link: string;
}

export type QueryGetProposalsAuthoredByAddressProposal = GraphQLResponse<{
  proposals: Proposal[];
}>;

/**
 * Returns all the proposals authored by an address
 * @param address
 */
export async function getProposalsAuthoredByAddress(address: string): Promise<Proposal[]> {
  logger.info(`Getting proposals authored by ${address}`);
  const { data } = await querySnapshotGraph<QueryGetProposalsAuthoredByAddressProposal>(`{
      proposals (first: 50000, skip: 0, where: {
        author: "${address}"
      }) {
        id
        ipfs
        author
        created
        space {
          id
          name
        }
        network
        type
        title
        body
        choices
        start
        end
        snapshot
        state
        link
      }
    }`);
  logger.info(`Found ${data.proposals.length} proposals authored by ${address}`);

  return data.proposals;
}

export interface Vote {
  id: string;
  voter: string;
  created: string;
  metadata: string;
  choice: string;
  space: {
    id: string;
    name: string;
  };
  proposal: {
    id: string;
    title: string;
    author: string;
  };
}

export type QueryGetVotesCastedByAddress = GraphQLResponse<{
  votes: Vote[];
}>;

/**
 * Returns all the votes casted by an address
 * @param address
 */
export async function getVotesCastedByAddress(address: string): Promise<Vote[]> {
  logger.info(`Found votes casted by ${address}`);
  const { data } = await querySnapshotGraph<QueryGetVotesCastedByAddress>(`{
      votes (first: 100000, skip: 0, where: {
        voter: "${address}"
      }) {
        id
        voter
        created
        metadata
        choice
        space {
          id
          name
        }
        proposal {
          id
          title
          author
        }
      }
    }`);

  logger.info(`Found ${data.votes.length} votes casted by ${address}`);

  return data.votes;
}
