import { useCallback, useEffect, useState } from 'react';
import type { Filter } from '../types';
import { bridge } from '..';
import Attributes from './Attributes';

interface IProps extends Filter {
  index: number;
  onRemove: (index: number) => void;
}

export default function FilterItem(props: IProps) {
  const { name, values, index, onRemove } = props;
  const [nodeAttrs, setNodeAttrs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (values) {
      const obj: Record<string, any> = {};
      for (const item of values) {
        obj[item.renderer.name] = item.value;
      }
      setNodeAttrs({ ...obj });
    }
  }, [JSON.stringify(values)]);

  const onUpdate = useCallback(async (attrName: string, value: any) => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.updateAttrs(${JSON.stringify(
        {
          [attrName]: value,
        },
      )})`,
    );
    setNodeAttrs(current => ({
      ...current,
      [attrName]: value,
    }));
  }, []);

  return (
    <Attributes
      title={`${name}${values ? ':' : ''}`}
      attrs={values?.map(item => item.renderer) || []}
      showExpandIcon={!!values}
      nodeAttrs={nodeAttrs}
      borderDashed
      showCopyToClipboard={false}
      showDelete
      updateAttr={onUpdate}
      keyColor="var(--color-filter-key)"
      onRemove={() => onRemove(index)}
    />
  );
}
