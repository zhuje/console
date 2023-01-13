import * as _ from 'lodash-es';
import * as React from 'react';

import { Bar } from '../../graphs';

const Label = ({ metric }) => <>{_.values(metric).join()}</>;

const BarChart: React.FC<BarChartProps> = ({
  pollInterval,
  query,
  pluginBasePath,
  dataSourceType,
}) => (
  <Bar
    barSpacing={5}
    barWidth={8}
    delay={pollInterval}
    LabelComponent={Label}
    noLink={true}
    query={query}
    pluginBasePath={pluginBasePath}
    dataSourceType={dataSourceType}
  />
);

type BarChartProps = {
  pollInterval: number;
  query: string;
  namespace?: string;
  pluginBasePath?: string;
  dataSourceType?: string;
};
export default BarChart;
