/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Praktikum_CF_2020_Result {
  nodes: {
    nodeID: string;
    time: string;
    personID: string;
    LocationID: string;
    pathogens: {
      pathogenID: string;
      result: boolean;
      screening?: boolean;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  }[];
  edges: {
    nodeID_start: string;
    nodeID_end: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
