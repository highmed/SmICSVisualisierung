"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var procedure_arguments = {
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
};
exports.default = procedure_arguments;
//# sourceMappingURL=procedure_arguments.js.map