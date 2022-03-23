import {useState, useEffect} from "react";
import { csv } from "d3-fetch";



const row = d => {
    for (const item in d){
        if(item != "date"){
            d[item] = +d[item]
        }

    }
    d["date"] = new Date(d["date"])
    return d;
}

export const useDataStream = (url) => {
    const [data, setData] = useState(null);
    useEffect(() => {
        // Call d3.csv using row function as accessor
        csv(url, row).then(setData);
    }, []);
    return data;
}