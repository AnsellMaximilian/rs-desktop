# Data sourcing notes (rumah sehat)

- **Revenue / spend**: always from `DeliveryDetails.price * qty`. Revenue/Spend totals, trends, and breakdowns should use delivery details joined via `Deliveries` (customer) or `Products`/`Suppliers`.
- **Cost**: when needed, use `DeliveryDetails.overallCost` and fall back to `cost * qty` if null.
- **Customers**
  - Spend trend: sum of `dd.price * dd.qty` grouped by period.
  - Insights: top products (qty and order count) and supplier breakdown are derived from delivery details. Invoice/delivery counts are informational only and should not drive revenue logic.
- **Products**
  - Sales trend and revenue vs overall cost: from delivery details. Revenue = `price * qty`, cost = `overallCost` (or `cost * qty`).
- **Suppliers**
  - Trends and top-product stacks use delivery details across all products for the supplier. Revenue/qty are sums of `price * qty` / `qty`.

Keep new charts/metrics aligned to these sources to avoid mixing invoice counts with delivery-based financials.***
