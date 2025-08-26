import { AppSidebar } from "@/components/app-sidebar";
import { ChartBarMultiple } from "@/components/charts/bar-chart";
import { ChartPieLabel } from "@/components/charts/pie-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <AppSidebar />
      <div className="flex flex-4 gap-10 ml-20">
        <Card className="w-[25%] justify-items-center">
          <CardHeader>Total sales</CardHeader>
          <CardContent><p className="font-semibold">14000$</p></CardContent>
        </Card>
        <Card className="w-[25%] justify-items-center">
          <CardHeader>Total commission</CardHeader>
          <CardContent><p className="font-semibold">5000$</p></CardContent>
        </Card>
        <Card className="w-[25%] justify-items-center">
          <CardHeader>Total promoters</CardHeader>
          <CardContent><p className="font-semibold">400</p></CardContent>
        </Card>
        <Card className="w-[25%] justify-items-center">
          <CardHeader>Total products</CardHeader>
          <CardContent><p className="font-semibold">14000</p></CardContent>
        </Card>
        </div>
      <div className="flex flex-2 gap-10 mt-10">
        
      <div className="w-80 justify-center ml-20" ><ChartPieLabel/></div>
      <div className="w-80 justify-center" ><ChartBarMultiple/></div>
      </div>
    </div>
  );
}
