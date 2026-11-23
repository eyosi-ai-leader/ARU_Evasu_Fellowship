/**
 * Giving details shown in the "Give" window.
 *
 * Fill in the bank details for each fund ONLY with numbers confirmed by the
 * fellowship treasurer. A fund with no accountNumber shows
 * "details coming soon" instead of anything made up.
 */
const giving = {
  title: "Give to the fellowship",
  thanks:
    "Thank you for supporting the work God is doing on our campuses. Choose where your gift should go.",

  funds: [
    {
      id: "main",
      name: "Main Campus",
      description: "Supports the Main Campus fellowship and its ministries.",
      bank: "Commercial Bank of Ethiopia (CBE)",
      accountName: "Bereket Hailu and Yididya Tilahun",
      accountNumber: "", // Paste the real Main Campus account number here
    },
    {
      id: "health",
      name: "Health Campus",
      description: "Supports the Health Campus fellowship and its ministries.",
      bank: "Commercial Bank of Ethiopia (CBE)",
      accountName: "Tariku Lemesa and Midheksa Habtamu",
      accountNumber: "1000714874668",
    },
    {
      id: "agriculture",
      name: "Agriculture Campus",
      description:
        "Supports the Agriculture Campus fellowship and its ministries.",
      bank: "Commercial Bank of Ethiopia (CBE)",
      accountName: "Dibore Tamiru and Melkamu Mengesha",
      accountNumber: "1000752815139",
    },
    {
      id: "bekoji",
      name: "Bekoji Campus",
      description: "Supports the Bekoji Campus fellowship and its ministries.",
      bank: "",
      accountName: "",
      accountNumber: "",
    },
    {
      id: "general",
      name: "General Fellowship",
      description:
        "Supports work shared by all the campus fellowships, such as conferences and outreach.",
      bank: "",
      accountName: "",
      accountNumber: "",
    },
  ],

  // Optional. Leave number "" to hide this box.
  mobileMoney: {
    label: "Telebirr",
    name: "",
    number: "",
  },

  // King James Version (public domain)
  verse: {
    text: "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.",
    reference: "2 Corinthians 9:7 (KJV)",
  },
};

export default giving;