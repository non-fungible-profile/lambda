import Express from 'express';

import { calculateAddressScore, getToken } from './nfp';
import { getOpenSeaAsset } from './nfp/seaport';
import { buildSVGString } from './nfp/nfp-svg';

export const server = Express();

/**
 * Generates and return a token string
 * @param tokenId the token Id
 */
export async function getTokenSVG(tokenId: string): Promise<string> {
  // Query the current owner from subgraph
  const token = await getToken(tokenId);
  const daoScore = await calculateAddressScore(token.owner);

  let foregroundImageUrl;

  {
    const { tokenAddress, tokenId } = token.foreground;

    if (tokenId != '' && tokenAddress != '') {
      // get foreground if any
      const { imageUrlOriginal } = await getOpenSeaAsset({
        tokenAddress,
        tokenId,
      });

      foregroundImageUrl = imageUrlOriginal;
    }
  }

  return buildSVGString({
    bannerText: `${daoScore} DAOScore`,
    tokenId,
    foregroundImageUrl,
  });
}

server.get('/:tokenId', async function generateNFP(req, res) {
  const { tokenId } = req.params;
  // Send an SVG regardless
  try {
    res.setHeader('Content-Type', 'image/svg+xml');
    const generatedNFP = await getTokenSVG(tokenId);
    res.send(generatedNFP).end();
  } catch (error) {
    res.status(404).send().end();
  }
});
