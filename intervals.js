const names =
  "unison,min 2nd,maj 2nd,min 3rd,maj 3rd,4th,tritone,5th,min 6th,maj 6th,min 7th,maj 7th,octave".split(
    ","
  );
compute = (a, b) => {
  const ratio = a / b;
  const semitones = (12 * Math.log(ratio)) / Math.log(2);
  const nearest = Math.round(semitones);
  const cents = (semitones - nearest) * 100;
  console.log(
    `${a}/${b} = ${names[nearest]} ${cents > 0 ? "+" : ""}${Math.round(cents)}`
  );
};
for (let i = 1; i < 20; i++) {
  compute(i + 1, i);
}

/*
2/1 = octave 0
3/2 = 5th +2
4/3 = 4th -2
5/4 = maj 3rd -14
6/5 = min 3rd +16
9/8 = maj 2nd +4
17/16 = min 2nd +5

32/17 = maj 7th -5
16/9 = min 7th -4
10/6 = maj 6th -16
8/5 = min 6th +14
*/
