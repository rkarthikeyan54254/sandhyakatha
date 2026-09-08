const POINTS: [string, string][] = [
  ['Every line has an address',
   'The work and the chapter sit at the top of the page, and where traditions differ the story says so out loud. The squirrel on the bridge is not in Vālmīki, and we tell you that on the page. A chat window will hand you a beautiful story with no way to know whether it invented the ending.'],
  ['Written for a voice, not an eye',
   'Short breath lines. A printed pause before the turn. A last line flagged slow down here. Tap a name and get how to say it — nuh-chi-KAY-taa — before you say it wrong in front of your child. No chat output is typeset for a human mouth.'],
  ['It ends with a question, not a moral',
   'Every story closes with one thing to ask, a fallback line if they shrug, and an honest answer ready for the hard follow-up: was Indra bad, then? The moral is not delivered. It is arrived at, by the two of you, out loud.'],
  ['It knows what day it is',
   'Tonight’s pick is chosen against the pañcāṅga and the season — the story of too much rain, on the week the rain is ending. That is the reason to open this on an ordinary Tuesday.'],
  ['It remembers the child, not the account',
   'Characters accumulate into a map your child builds by listening. Hanumān and Bhīma turn out to be brothers. Kṛṣṇa the seven-year-old turns out to be the sixty-year-old from the other epic. Nothing in a chat thread accrues — and nothing here leaves the device.'],
  ['Nothing is generated while you wait',
   'The collection is drafted, source-checked, reviewed and versioned before it ships. Which means it is instant, it is offline on the flight, it is the same story twice when they ask again — and it cannot invent a Purāṇa at bedtime.']
];

export default function Why() {
  return (
    <>
      <h1 className="page">Why not just ask a chatbot?</h1>
      <p className="thesis">Because at 8:40pm you do not want a generator. You want the one right story,
        already chosen, already checked, already laid out for your voice — and a reason to come back tomorrow.</p>
      <div className="hair"><span className="eyebrow">Six things a chat window cannot do</span></div>
      {POINTS.map(([h, p], i) => (
        <div className="pt" key={h}><span className="k">{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>
      ))}
      <div className="closing">
        <p><b>Nothing is cut from the collection.</b> The Periya Purāṇam is magnificent and in places brutal;
          the Mahābhārata is a war. The hardest stories wait behind a switch until you have read them yourself,
          and each one tells you what is coming before you begin. You decide when your child is ready,
          because you are the only person who can.</p>
      </div>
    </>
  );
}
