import {useState, useEffect} from "react";
import { json } from "d3-fetch";


const url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_dendrogram_full.json"
// Example how the data looks
const dataset = {
    children:
    [
        {
        name: 'boss1',
        children: [
            { name: 'a', group: 'A', value: 28, colname: 'level1' },
            { name: 'b', group: 'A', value: 19, colname: 'level1' },
            { name: 'c', group: 'C', value: 18, colname: 'level1' },
            { name: 'd', group: 'C', value: 19, colname: 'level1' },
        ],
        colname: 'level1',
        }
    ],
    name: "CEO"
};

const row = d => {
    return d;
}

export const useDataTree = () => {
    const [data, setData] = useState(null);
    useEffect(() => {
        // Call d3.csv using row function as accessor
        json(url, row).then(setData);
    }, []);
    return data;
}