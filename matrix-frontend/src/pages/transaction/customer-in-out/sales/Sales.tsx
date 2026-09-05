import { ListingHeader } from "@/components/common/ListingHeader";

const Sales = () => {
  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Sales"
        subtitle="Manage your sales"
        addText="Add Sales"
      />
    </div>
  );
};

export default Sales;
