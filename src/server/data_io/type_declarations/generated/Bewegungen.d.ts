/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Bewegungen = {
  id?: string;
  Beginn: string;
  /**
   * ist immer da, falls ein Aufenthalt noch nicht abgeschlossen ist steht hier das aktuelle Datum drin
   */
  Ende: string;
  PatientID: string;
  FallID: string;
  StationID?: string;
  LfdNr?: number;
  stationList?: string;
  /**
   * this is only called 'number', but is really a textual identifier
   */
  ZimmerNr?: string;
  CaseID?: number;
  CaseType_l?: string;
  CaseType_k?: string;
  BewegungsartID?: number;
  Bewegungsart_l?: string;
  Bewegungsart_k?: string;
  BewegungstypID: number;
  Bewegungstyp?: string;
  [k: string]: unknown;
}[];
