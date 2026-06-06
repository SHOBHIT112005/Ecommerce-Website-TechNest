import Image from "next/image";
import Link from "next/link";

export default function Product({_id,name, price, description, picture }) {
  return (
    <Link href={"/product/" + _id} className="w-64 shrink-0 hover:border-emerald-300 border border-transparent rounded-xl p-1 flex flex-col transition-colors duration-200">
      <div className="bg-blue-100 rounded-xl h-44 flex items-center justify-center overflow-hidden p-4">
        <Image src={picture} alt={name} width={256} height={256} className="object-contain w-full h-full" />
      </div>
      <div className="mt-2 flex-grow px-2">
        <h3 className="font-bold text-lg">{name}</h3>
      </div>
      <p className="text-sm mt-1 px-2 leading-4 tracking-tight line-clamp-2">{description}</p>
      <div className="flex mt-2 items-center px-2 pb-2">
        <div className="text-2xl font-bold grow">${price}</div>
        <div className="text-emerald-500 text-sm font-semibold hover:text-emerald-600 transition-colors">
          View Details
        </div>
      </div>
    </Link>
  );
}
  
