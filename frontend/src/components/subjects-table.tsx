import React, { useEffect, useRef } from "react";
import { DatasetApiSubjectModel } from "../../../shared-src/api-models/dataset";

type Props = {
  subjects: { [id: string]: DatasetApiSubjectModel };

  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
};

/**
 * A table displaying the subjects and samples in a dataset.
 *
 * @param props
 * @constructor
 */
export const SubjectsTable: React.FC<Props> = (props: Props) => {
  const checkRef = useRef<HTMLInputElement>(null);

  const allChecked =
    Object.entries(props.subjects).length === props.selected.size;
  const noneChecked = 0 === props.selected.size;

  useEffect(() => {
    if (checkRef && checkRef.current) {
      checkRef.current.checked = allChecked && !noneChecked;
      checkRef.current.indeterminate = !noneChecked && !allChecked;
    }
  }, [props.subjects, props.selected, allChecked, noneChecked]);

  const headerClick = (e: any) => {
    if (allChecked) {
      console.log("Doing set to nothing");
      props.setSelected(new Set());
    }
    else {
      console.log("Doing set to all");
      props.setSelected(new Set(Object.keys(props.subjects)));
    }

    return false;
  };

  const itemClick = (subjectId: string) => {
    const copySet = new Set(props.selected);
    if (props.selected.has(subjectId)) {
      copySet.delete(subjectId);
    } else {
      copySet.add(subjectId);
    }
    props.setSelected(copySet);
  };

  return (
    <table className="table w-full border-gray-500 rounded-md p-4">
      <thead  className="bg-gray-50">
        <tr>
          <th scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <input
              type="checkbox"
              ref={checkRef}
              onClick={headerClick}
            />
          </th>
          <th scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Id</th>
          <th scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Family Id
            <br />
            <span className="text-xs">(if part of family)</span>
          </th>
          <th scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Ids</th>
        </tr>
      </thead>
      <tbody  className="bg-white divide-y divide-gray-200">
        {props.subjects &&
          Object.entries(props.subjects).map(([subjectId, subject]) => (
            <tr key={subjectId}>
              <td  className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={props.selected.has(subjectId)}
                  onClick={() => itemClick(subjectId)}
                />
              </td>
              <td  className="px-6 py-4 whitespace-nowrap" onClick={() => itemClick(subjectId)}>{subjectId}</td>
              <td  className="px-6 py-4 whitespace-nowrap">{subject.familyId}</td>
              <td  className="px-6 py-4 whitespace-nowrap">{JSON.stringify(subject.sampleIds)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
