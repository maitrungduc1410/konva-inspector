import { ChangeEvent, useEffect, useState } from "react";
import { bridge } from "..";
import DownArrow from "./icons/DownArrow";
import RightArrow from "./icons/RightArrow";
import { Filter } from "../types";
import FilterItem from "./FilterItem";
import { FILTER_SELECT } from "./constants";

export default function Filters() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      getNodeFilters();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getNodeFilters = async () => {
    const data = await bridge<Filter[]>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getSelectedNodeFilters()`
    );
    setFilters(data);
  };

  const renderArrow = () => {
    return (
      <div
        className="expand-collapse-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    );
  };

  const removeFilterItem = async (index: number) => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.removeSelectedNodeFilterAtIndex(${index})`
    );

    // immediately update UI instead waiting for next interval update
    setFilters(filters.filter((item, _index) => _index !== index));
  };

  const addNewFilter = async (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value !== "-1") {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.addFilterToSelectedNode('${value}')`
      );

      e.target.value = "-1";
      e.target.blur();
    }
  };

  return (
    <div className="attributes">
      <div className="header-row">
        {renderArrow()}
        <div className="header" style={{ color: "var(--color-filter-header)" }}>
          Filters: [{filters.map((item) => item.name).join(", ")}]
        </div>
      </div>
      {expanded && (
        <div className="attr-list" style={{ marginTop: 6 }}>
          {filters.map((item, index) => (
            <FilterItem
              key={`${item}-${index}`}
              {...item}
              index={index}
              onRemove={removeFilterItem}
            />
          ))}
        </div>
      )}
      <div className="attributes dashed">
        <div className="attr-list">
          <div className="attr-item">
            <select onChange={addNewFilter}>
              <option value={-1} selected>
                Add new Filter
              </option>
              {FILTER_SELECT.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
