import React from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import Card from "~/renderer/components/Box/Card";
import { Props, PropsBody } from "../types";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { MarketPerformanceWidgetFooter } from "./Footer";
import { MarketPerformanceWidgetHeader } from "./Header";
import { Error } from "./Error";
import { WidgetList } from "./WidgetList";

const BodyByMode: Record<ABTestingVariants, React.ComponentType<PropsBody>> = {
  [ABTestingVariants.variantA]: WidgetList,
  [ABTestingVariants.variantB]: WidgetList,
};

export function MarketPerformanceWidgetContainer({
  variant,
  list,
  setOrder,
  order,
  range,
  isLoading,
  hasError,
  top,
  enableNewFeature,
}: Props) {
  const Body = BodyByMode[variant];

  return (
    <Card
      px={{
        _: 4,
        lg: 4,
        xl: 5,
        xxl: 6,
      }}
      py={"23px"}
      grow
      data-testid="market-performance-widget"
    >
      <MarketPerformanceWidgetHeader order={order} onChangeOrder={setOrder} />

      <Flex flex={1} alignItems="center" justifyContent="center">
        {isLoading ? (
          <InfiniteLoader />
        ) : hasError ? (
          <Error
            title={"dashboard.marketPerformanceWidget.error.title"}
            description={"dashboard.marketPerformanceWidget.error.description"}
            top={top}
            range={range}
          />
        ) : (
          <Body
            data={list}
            order={order}
            range={range}
            top={top}
            enableNewFeature={enableNewFeature}
          />
        )}
      </Flex>

      <MarketPerformanceWidgetFooter />
    </Card>
  );
}
