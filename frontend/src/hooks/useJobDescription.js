import { useEffect, useState } from "react";
import { getJdPresetsApi } from "../api/documentsApi";
import { JOB_DESCRIPTIONS } from "../data/jobDescriptions";

export default function useJobDescritpion() {
    const [jobDescriptions, setJobDescriptions] = useState(JOB_DESCRIPTIONS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try{
                const data = await getJdPresetsApi();
                const list = data?.presets?.length ? data.presets : JOB_DESCRIPTIONS;
                if(!cancelled)
                    setJobDescriptions(list);
            } catch {
                if(!cancelled)
                    setJobDescriptions(JOB_DESCRIPTIONS);
            } finally {
                if (!cancelled) 
                    setLoading(false);
            }
        })();
        return() => {
            cancelled = true;
        };
    }, []);

    return {jobDescriptions, loading};
}
