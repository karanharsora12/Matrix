import { decodeURL } from "@/lib/utils";
import { useParams } from "react-router-dom";

const Sales: React.FC = () => {
  const params = useParams();
  const token = decodeURL(params?.token);
  console.log(token);

  return <div>Sales</div>;
};

export default Sales;
