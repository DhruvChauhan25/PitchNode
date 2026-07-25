import { useCallback, useEffect, useState } from "react";
import { listCvsApi, listJdsApi } from "../api/documentsApi";

export default function useUserDocuments(){
  const [cvs, setCvs] = useState([]);
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try{
        const [cvRes, jdRes] = await Promise.all([listCvsApi(), listJdsApi()]);
      setCvs(cvRes?.cvs || []);
      setJds(jdRes?.job_descriptions || []);
    } catch {
        setCvs([]);
        setJds([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = true;
    (async () => {
        await reload();
        if(cancelled)
            return;
    })();

    return () => {
        cancelled = true;
    };
  }, [reload]);

  return{ cvs, jds, loading, reload}
}

