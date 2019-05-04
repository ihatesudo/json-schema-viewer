import { RendererFunc, TreeList, TreeListEvents, TreeStore } from '@stoplight/tree-list';
import { Omit } from '@stoplight/types';

import * as cn from 'classnames';
import { JSONSchema4 } from 'json-schema';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import _isEmpty = require('lodash/isEmpty');

import { useMetadata } from '../hooks';
import { IMasking } from '../types';
import { lookupRef } from '../utils';
import { DetailDialog, ISchemaRow, MaskedSchema, SchemaRow, TopBar } from './';

const canDrag = () => false;

export interface ISchemaTree extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onError'>, IMasking {
  name?: string;
  dereferencedSchema?: JSONSchema4;
  schema: JSONSchema4;
  expanded?: boolean;
  hideTopBar?: boolean;
  treeStore: TreeStore;
}

export const SchemaTree = observer<ISchemaTree>(props => {
  const {
    expanded = false,
    schema,
    dereferencedSchema,
    hideTopBar,
    selected,
    canSelect,
    onSelect,
    name,
    treeStore,
    className,
    ...rest
  } = props;

  const [maskedSchema, setMaskedSchema] = React.useState<JSONSchema4 | null>(null);

  const metadata = useMetadata(schema);

  const handleMaskEdit = React.useCallback<ISchemaRow['onMaskEdit']>(
    node => {
      setMaskedSchema(lookupRef(node.path, dereferencedSchema));
    },
    [dereferencedSchema]
  );

  treeStore.on(TreeListEvents.NodeClick, (e, node) => {
    if (node.canHaveChildren) {
      treeStore.toggleExpand(node);
    } else {
      treeStore.setActiveNode(node.id);
    }
  });

  const handleMaskedSchemaClose = React.useCallback(() => setMaskedSchema(null), []);

  const itemData = {
    onSelect,
    onMaskEdit: handleMaskEdit,
    selected,
    canSelect,
    treeStore,
  };

  const rowRenderer = React.useCallback<RendererFunc>(node => <SchemaRow node={node} {...itemData} />, [itemData]);

  const shouldRenderTopBar = !hideTopBar && (name || !_isEmpty(metadata));

  return (
    <div className={cn(className, 'h-full w-full')} {...rest}>
      {maskedSchema && (
        <MaskedSchema onClose={handleMaskedSchemaClose} onSelect={onSelect} selected={selected} schema={maskedSchema} />
      )}

      {shouldRenderTopBar && <TopBar name={name} metadata={metadata} />}

      <DetailDialog treeStore={treeStore} />

      <TreeList striped rowHeight={40} canDrag={canDrag} store={treeStore} rowRenderer={rowRenderer} />
    </div>
  );
});
SchemaTree.displayName = 'JsonSchemaViewer.SchemaTree';
