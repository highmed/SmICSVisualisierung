const procedure_arguments: { readonly [key: string]: string[] } = {
  // const procedure_arguments: object = {
  Patient_Bewegung_Ps: ["patientList"],
  Patient_Labordaten_Ps: ["patientList"],
  Arguments_TTEsKSs: [
    "starttime",
    "endtime",
    "pathogenList",
    "hospital",
    "station",
  ],
  Arguments_TTKP_Degree: [
    "starttime",
    "endtime",
    "patientID",
    "hospital",
    "Degree",
  ],
  Arguments_TTPK: ["starttime", "endtime", "patientID", "hospital"],
  Labor_ErregerProTag_TTEsKSs: [
    "starttime",
    "endtime",
    "pathogenList",
    "hospital",
    "station",
  ],
  // Contact_NthDegree_TTKP_Degree: [
  //   "starttime",
  //   "endtime",
  //   "patientID",
  //   "degree",
  // ],
  Contact_NthDegree_TTKP_Degree: [
    "starttime",
    "endtime",
    "patientID",
    "degree",
    "hospital",
  ],
  OutbreakDetectionConfigurations: [],
  OutbreakDetectionResultSet: ["starttime", "endtime", "configName"],
  RKIalgo: ["starttime", "endtime"],
  // Arguments_RKIalgo: ["starttime", "endtime"],

  Patient_Symptom: ["patientList"],

  Patient_Vaccination: ["patientList"],

  Metadaten: ["patientList"],
}

export default procedure_arguments
