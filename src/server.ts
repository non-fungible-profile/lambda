import debugfactory from 'debug';
import Express from 'express';
import dayjs from 'dayjs';
import { calculateAddressScore, getToken } from './nfp';
import { getOpenSeaAsset } from './nfp/seaport';
import { buildSVGString } from './nfp/nfp-svg';

const httpDebug = debugfactory('http');
const nfpDebug = debugfactory('nfp');
export const server = Express();

export interface NFPCacheItem {
  createdAt: number;
  tokenId: string;
  uri: string;
}

const cacheNFPMap = new Map<string, NFPCacheItem>();

/**
 * Generates and return a token string
 * @param tokenId the token Id
 */
export async function getTokenSVG(tokenId: string): Promise<string> {
  // Query the current owner from subgraph
  // @ts-ignore
  const token = await getToken(tokenId);
  const daoScore = await calculateAddressScore(token.owner.id);
  let foregroundImageUrl;

  if (token.foreground != null) {
    const { tokenAddress, tokenId } = token.foreground;

    if (tokenId != '' && tokenAddress != '') {
      // get foreground if any
      getOpenSeaAsset({
        tokenAddress,
        tokenId,
      })
        .then(({ image_original_url }) => {
          nfpDebug({ image_original_url });
          foregroundImageUrl = image_original_url;
        })
        .catch(error => {
          if (error.statusCode == 404) {
            nfpDebug(`OpenSea asset could not be found for token #${tokenId} on contract ${tokenAddress}`);
          } else {
            nfpDebug(error);
          }
        });
    }
  }

  const shortAddress = `${token.owner.id.substr(0, 6)} ... ${token.owner.id.substr(-4)}`;

  return buildSVGString({
    bannerText: `${shortAddress} • ${daoScore.score} DAOScore`,
    tokenId,
    foregroundImageUrl,
  });
}

server.get('/:tokenId', async function generateNFP(req, res) {
  const { tokenId } = req.params;
  httpDebug(`tokenId `, req.params);
  try {
    // Send an SVG regardless
    res.setHeader('Content-Type', 'image/svg+xml');
    // Return from cache
    const cachedItem = cacheNFPMap.get(tokenId);
    const diff = Math.abs(dayjs().diff(cachedItem?.createdAt));

    if (cachedItem && diff < 180) {
      return res.send(cachedItem.uri).end();
    }

    const generatedNFP = await getTokenSVG(tokenId);

    httpDebug(`Saving token #${tokenId} to memory cache`);
    cacheNFPMap.set(tokenId, {
      createdAt: dayjs().unix(),
      uri: generatedNFP,
      tokenId,
    });
    httpDebug(`Saved token #${tokenId} to memory cache`);

    res.send(generatedNFP).end();
  } catch (error) {
    httpDebug(`Error memory `, error);
    res.status(404).send().end();
  }
});
