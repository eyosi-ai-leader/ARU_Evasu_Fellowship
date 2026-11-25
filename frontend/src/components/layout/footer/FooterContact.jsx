import { Mail, Phone, MapPin } from "lucide-react";


const contactInfo = [
  {
    icon: Mail,
    text: "info@arsi-u-fellowship.com",
  },
  {
    icon: Phone,
    text: "+251 992912263",
  },
  {
    icon: MapPin,
    text: "Asella, Arsi University, Arsi Zone, Oromia Region, Ethiopia",
  },
];


export default function FooterContact() {
  return (
    <div>

      <h3 className="mb-5 text-lg font-semibold">
        Contact Us
      </h3>


      <ul className="space-y-4">

        {contactInfo.map((item) => {

          const Icon = item.icon;

          return (
            <li
              key={item.text}
              className="flex items-center gap-3 text-sm text-slate-300"
            >

              <Icon
                size={18}
                className="text-blue-400"
              />

              <span>
                {item.text}
              </span>

            </li>
          );

        })}

      </ul>


    </div>
  );
}