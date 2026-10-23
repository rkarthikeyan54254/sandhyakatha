import type { AppLocale } from '../lib/app-locale';

const en = {
  repairTitle: 'Family profile needs repair',
  repairLead: 'An earlier sync bug gave two child entries one stored history.',
  repairPreserve: 'Nothing has been deleted. Because this history is stored under one shared id, we will not guess which child it belongs to.',
  repairChoose: (n: number) => `Choose the child whose past ${n} stories this history belongs to. Both entries receive fresh ids; history moves only to the child you choose.`,
  repairWait: 'If the recorded stories include reading with both children, do not choose yet. Leave this as it is; the conflict and history will be preserved.',
  owner: (name: string) => `Past reading belongs to ${name}`,
  childAge: (age: number) => `the ${age}-year-old`,
  children: 'Who you are reading to', thisChild: 'this child',
  readTo: (name: string) => `Read to ${name}`,
  addName: 'Add a name', age: 'Age',
  confirmRemove: (name: string) => `Confirm removing ${name}`,
  remove: (name: string) => `Remove ${name}`,
  removeHistory: (n: number) => `Remove, and ${n} recorded stories?`,
  addChild: '+ Add another child', gateTitle: 'Include the difficult ones',
  gateDetail: 'Siṟuttoṇḍar, Kaṇṇappar, Kōṭpuli and others. These wait until you have read them yourself. Each tells you what is coming before you begin.'
};
type Copy = typeof en;
const hi: Copy = {
  repairTitle: 'परिवार की जानकारी में सुधार चाहिए',
  repairLead: 'पहले की एक सिंक त्रुटि से दो बच्चों की प्रविष्टियों के साथ एक ही पुराना इतिहास जुड़ गया है।',
  repairPreserve: 'कुछ भी मिटाया नहीं गया है। यह इतिहास एक ही पहचान के तहत रखा है; हम अनुमान नहीं लगाएँगे कि यह किस बच्चे का है।',
  repairChoose: n => `चुनें कि इन ${n} पुरानी कहानियों का इतिहास किस बच्चे का है। दोनों प्रविष्टियों को नई पहचान मिलेगी; इतिहास केवल आपके चुने बच्चे से जुड़ेगा।`,
  repairWait: 'अगर इस इतिहास में दोनों बच्चों के साथ पढ़ी कहानियाँ हैं, तो अभी किसी को न चुनें। इसे रहने दें; इतिहास सुरक्षित रहेगा और हम उसका अनुमान से बँटवारा नहीं करेंगे।',
  owner: name => `पुराना इतिहास ${name} का है`, childAge: age => `${age} साल का बच्चा`,
  children: 'आप किसे कहानी सुना रहे हैं', thisChild: 'यह बच्चा', readTo: name => `${name} को सुनाएँ`,
  addName: 'नाम जोड़ें', age: 'उम्र', confirmRemove: name => `${name} को हटाने की पुष्टि करें`,
  remove: name => `${name} को हटाएँ`, removeHistory: n => `बच्चे और ${n} कहानियों का इतिहास हटाएँ?`,
  addChild: '+ एक और बच्चा जोड़ें', gateTitle: 'कठिन प्रसंगों वाली कहानियाँ भी दिखाएँ',
  gateDetail: 'सिरुत्तोण्डर, कण्णप्पर, कोट्पुलि और दूसरे कठिन प्रसंग। पहले आप इन्हें खुद पढ़ लें। हर कहानी शुरू होने से पहले बताती है कि उसमें क्या आएगा।'
};
const ta: Copy = {
  repairTitle: 'குடும்ப விவரத்தில் திருத்தம் தேவை',
  repairLead: 'முந்தைய ஒத்திசைவுப் பிழையால் இரண்டு குழந்தைகளின் பதிவுகளுக்கு ஒரே வாசிப்பு வரலாறு சேர்ந்துவிட்டது.',
  repairPreserve: 'எதுவும் அழிக்கப்படவில்லை. இந்த வரலாறு ஒரே அடையாளத்தில் சேமிக்கப்பட்டுள்ளது; எந்தக் குழந்தைக்கு உரியது என்று நாங்கள் ஊகிக்க மாட்டோம்.',
  repairChoose: n => `இந்த ${n} கதைகளின் பழைய வரலாறு எந்தக் குழந்தைக்கு உரியது என்று தேர்ந்தெடுங்கள். இருவருக்கும் புதிய அடையாளங்கள் கிடைக்கும்; வரலாறு நீங்கள் தேர்ந்தெடுத்த குழந்தைக்கு மட்டும் சேரும்.`,
  repairWait: 'இந்த வரலாற்றில் இரு குழந்தைகளுக்கும் வாசித்த கதைகள் இருந்தால் இப்போது தேர்ந்தெடுக்க வேண்டாம். அப்படியே விடுங்கள்; வரலாறு பாதுகாக்கப்படும், ஊகித்துப் பிரிக்கப்படாது.',
  owner: name => `பழைய வாசிப்பு வரலாறு ${name}க்கு உரியது`, childAge: age => `${age} வயதுக் குழந்தை`,
  children: 'யாருக்குக் கதை வாசிக்கிறீர்கள்', thisChild: 'இந்தக் குழந்தை', readTo: name => `${name}க்கு வாசிக்கவும்`,
  addName: 'பெயரைச் சேர்க்கவும்', age: 'வயது', confirmRemove: name => `${name}ஐ நீக்குவதை உறுதிப்படுத்தவும்`,
  remove: name => `${name}ஐ நீக்கவும்`, removeHistory: n => `குழந்தையையும் ${n} கதைகளின் வரலாற்றையும் நீக்கவா?`,
  addChild: '+ இன்னொரு குழந்தையைச் சேர்க்கவும்', gateTitle: 'கடினமான நிகழ்வுகளுள்ள கதைகளையும் காட்டவும்',
  gateDetail: 'சிறுத்தொண்டர், கண்ணப்பர், கோட்புலி போன்றோரின் கதைகள். முதலில் நீங்களே வாசித்துப் பாருங்கள். ஒவ்வொரு கதையும் தொடங்குவதற்கு முன் அதில் வருவதைச் சொல்கிறது.'
};
export function familyCopy(locale: AppLocale): Copy {
  return locale === 'hi-IN' ? hi : locale === 'ta-IN' ? ta : en;
}
