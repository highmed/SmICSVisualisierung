"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_worse_carrier_status = exports.get_carrier_status = exports.get_status_ranking = void 0;
exports.get_status_ranking = function (status) {
    var status_ranking = {
        negative: 0,
        unknown: 1,
        infected: 2,
        diseased: 3,
    };
    return status_ranking[status];
};
exports.get_carrier_status = function (befund, screening, oldStatus) {
    var newStatus = "unknown";
    // TODO: SMICS-0.8
    newStatus = "negative";
    // ! Es gibt kein negative bisher
    if (befund && screening) {
        newStatus = "infected";
    }
    else if (befund && !screening) {
        newStatus = "diseased";
    }
    return exports.get_worse_carrier_status(oldStatus, newStatus);
};
exports.get_worse_carrier_status = function (oldStatus, newStatus) {
    var oldS = exports.get_status_ranking(oldStatus);
    var newS = exports.get_status_ranking(newStatus);
    var status = oldStatus;
    if (newS > oldS) {
        status = newStatus;
    }
    // console.log("* * * * *")
    console.log("GET WORSE CARRIER STATUS");
    console.log("old - new", oldStatus + " - " + newStatus);
    console.log("Result: " + status);
    // console.log(" - - - - -")
    return status;
};
//# sourceMappingURL=carrier_status.js.map