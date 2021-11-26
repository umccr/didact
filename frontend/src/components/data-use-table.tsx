import React from "react";
import nresImage from "../assets/img/duo_svg/no_restrictions.v2.svg";
import dsImage from "../assets/img/duo_svg/disease_specific.v2.svg";
import hmbImage from "../assets/img/duo_svg/health_medical_biomedical.v2.svg";
import poaImage from "../assets/img/duo_svg/population_origins_or_ancestry.v2.svg";
import gruImage from "../assets/img/duo_svg/general_research_use.v2.svg";

import {
  DataUseLimitation,
  DataUseLimitationDiseaseSpecific,
} from "../../../shared-src/api-models/data-use-limitation";
import {
  DataUseModifierSpecificInstitution,
  DataUseModifierTimeLimit,
} from "../../../shared-src/api-models/data-use-modifier";

type Props = {
  dataUse: DataUseLimitation;

  // if true tells it to show the associated check section UI - noting
  // the check section renders tri-state (yes, no, empty)
  showChecked: boolean;

  // render an associated tick or cross with given value, or empty for undefined
  checked?: boolean;
};

/**
 *
 * @param props
 * @constructor
 */
export const DataUseTable: React.FC<Props> = (props: Props) => {
  if (!typeof props.dataUse.code) {
    return (
      <p>
        {(props.dataUse as any).description ||
          "Not a recognised data use limitation"}
      </p>
    );
  }

  let dataUseIcon;

  if (props.dataUse.code?.id === "DUO:0000004")
    dataUseIcon = <img src={nresImage} alt="no restrictions icon" width={32} />;
  else if (props.dataUse.code?.id === "DUO:0000006")
    dataUseIcon = (
      <img src={hmbImage} alt="health medical restriction icon" width={32} />
    );
  else if (props.dataUse.code?.id === "DUO:0000007")
    dataUseIcon = (
      <img src={dsImage} alt="disease specific restriction icon" width={32} />
    );
  else if (props.dataUse.code?.id === "DUO:0000011")
    dataUseIcon = (
      <img
        src={poaImage}
        alt="population ancestry restriction icon"
        width={32}
      />
    );
  else if (props.dataUse.code?.id === "DUO:0000042")
    dataUseIcon = (
      <img
        src={gruImage}
        alt="general research use restrictions icon"
        width={32}
      />
    );
  else dataUseIcon = <span>{props.dataUse.code}</span>;

  return (
    <table className="table border border-dashed border-gray-500 rounded-md p-4">
      <thead>
        <tr>
          <td width={32}>{dataUseIcon}</td>
          <td>{props.dataUse.code?.label}</td>
          <td>{props.dataUse.code?.id === "DUO:0000007" && <span>=</span>}</td>
          <td>
            {props.dataUse.code?.id === "DUO:0000007" && (
              <span>
                {
                  (props.dataUse as DataUseLimitationDiseaseSpecific).disease
                    ?.label
                }
              </span>
            )}
          </td>
          <td>
            {props.showChecked && props.checked && <span>✅</span> }
            {props.showChecked && props.checked === false && <span>❌</span> }
          </td>
        </tr>
      </thead>
      <tbody>
        {props.dataUse.modifiers &&
          props.dataUse.modifiers.map((m, index) => (
            <tr key={index}>
              <td></td>
              <td>{m.code?.label}</td>
              <td>
                {(m.code?.id === "DUO:0000028" ||
                  m.code?.id === "DUO:0000025") && <span>=</span>}
              </td>
              <td>
                {m.code?.id === "DUO:0000028" &&
                  (m as DataUseModifierSpecificInstitution).institutes &&
                  (m as DataUseModifierSpecificInstitution).institutes.map(
                    (inst, index) => <span key={index}>{inst.label}</span>
                  )}
                {m.code?.id === "DUO:0000025" && (
                  <span>{(m as DataUseModifierTimeLimit).start}</span>
                )}
              </td>
              <td></td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
