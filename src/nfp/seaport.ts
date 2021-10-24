import debugfactory from 'debug';
import axios from 'axios';

export const debug = debugfactory('opensea');

export interface GetOpenSeaAssetParams {
  tokenAddress: string;
  tokenId: string | number | null;
}
/**
 * Simple, unannotated asset spec
 */
export interface Asset {
  tokenId: string | null;
  tokenAddress: string;
  name?: string;
  decimals?: number;
}
/**
 * Annotated asset spec with OpenSea metadata
 */
export interface OpenSeaAsset extends Asset {
  name: string;
  description: string;
  imageUrl: string;
  imagePreviewUrl: string;
  image_original_url: string;
  imageUrlThumbnail: string;
  openseaLink: string;
  externalLink: string;
  traits: object[];
  numSales: number;
}

export async function getOpenSeaAsset({ tokenAddress, tokenId }: GetOpenSeaAssetParams): Promise<OpenSeaAsset> {
  const { data } = await axios.get<OpenSeaAsset>(
    `https://api.opensea.io/api/v1/asset/${tokenAddress}/${tokenId || 0}/`
  );
  debug(data);
  return data;
}
