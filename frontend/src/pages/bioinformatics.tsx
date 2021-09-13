import React, { useContext, useState } from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { useQuery } from "react-query";
import axios from "axios";
import { DatasetApiModel } from "../../../shared-src/api-models/dataset";
import { DataUseTable } from "../components/data-use-table";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";

export const BioinformaticsPage: React.FC = () => {
  const { createAxiosInstance, userId, userBearerToken } = useContext(UserLoggedInContext);

  const [ one, setOne ] = useState("");
  const [ two, setTwo ] = useState("");
  const [ three, setThree ] = useState("");

  const doit= async () => {
    try {
      const htsget96chr1 = await createAxiosInstance().get("https://htsget.dev.umccr.org/variants/10g/https/HG00096?referenceName=chr1");
      setOne(JSON.stringify(htsget96chr1.data, null, 2));
    }
    catch(e) {
      setOne(JSON.stringify(e));
    }

    try {
      const htsget97chr1 = await createAxiosInstance().get("https://htsget.dev.umccr.org/variants/10g/https/HG00097?referenceName=chr1");
      setTwo(JSON.stringify(htsget97chr1.data, null, 2));
    }
    catch(e) {
      setTwo(JSON.stringify(e));
    }

    try {
      const htsget99chr1 = await createAxiosInstance().get("https://htsget.dev.umccr.org/variants/10g/https/HG00099?referenceName=chr1");
      setThree(JSON.stringify(htsget99chr1.data, null, 2));
    }
    catch(e) {
      setThree(JSON.stringify(e));
    }
  }

  return (
    <LayoutStandardPage
      pageTitle="Bioinformatics"
      includeResearcherCommitteeChoice={false}
    >
      <p>Your passport JWT</p>
      <textarea value={userBearerToken} rows={5}>
      </textarea>
      <button className="btn btn-blue" onClick={doit}>
        Go
      </button>
      <p>96 (chr1)</p>
      <pre>{one}</pre>
      <p>97 (chr1)</p>
      <pre>{two}</pre>
      <p>99 (chr1)</p>
      <pre>{three}</pre>
    </LayoutStandardPage>
  );
};
