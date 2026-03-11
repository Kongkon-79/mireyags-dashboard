import React from 'react'
import { DashboardOverview } from './_components/dashboard-overview'
import { RevenueActivity } from './_components/revenue-activity'
import TotalCustomersChart from './_components/total-customer'

const DashboardOverviewPage = () => {
  return (
    <div>
      <DashboardOverview/>
      <RevenueActivity/>
      <TotalCustomersChart/>
    </div>
  )
}

export default DashboardOverviewPage