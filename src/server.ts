import Express from 'express';

import { calculateAddressScore, getSeaPort, getToken, TokenForeground } from './nfp';
import { buildSVGString } from './nfp/nfp-svg';

export const server = Express();

export async function getTokenForegroundTokenUri({ tokenAddress, tokenId }: TokenForeground): Promise<string> {
  const seaport = await getSeaPort();

  const asset = await seaport.api.getAsset({
    tokenAddress,
    tokenId,
  });

  return asset.imageUrlOriginal;
}

/**
 * Generates and return a token string
 * @param tokenId the token Id
 */
export async function getTokenSVG(tokenId: string): Promise<string> {
  // Query the current owner from subgraph
  const token = await getToken(tokenId);
  const daoScore = await calculateAddressScore(token.owner);
  const foregroundImageUrl = await getTokenForegroundTokenUri(token.foreground);

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
