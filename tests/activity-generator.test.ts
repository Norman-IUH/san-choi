import {expect,test} from "vitest";
import {generateBankActivity,generateTextActivity,parseGeneratorWords,type GeneratorInput} from "../lib/activity-generator";

const setup:GeneratorInput={source:"words",title:"Animals",level:"Kids",skill:"Vocabulary",difficulty:"gentle",
  template:"quiz",count:2,topic:"Animals",body:"cat | mèo\ndog | chó\nbird | chim",lesson:""};

test("generates requested editable quiz rows from supplied words and rotates choices",()=>{
  const words=parseGeneratorWords(setup,[])!;
  const result=generateBankActivity(setup,words)!;
  expect(result.map(row=>row.answers[0])).toEqual(["cat","dog"]);
  expect(result.map(row=>row.options.length)).toEqual([2,2]);
  expect(result[1].options[0]).not.toBe("dog");
  expect(generateBankActivity({...setup,template:"image-quiz"},words)).toBeNull();
  expect(parseGeneratorWords({...setup,body:"unknown"},[])).toBeNull();
});

test("cloze answers come from the supplied passage and retain the requested skill",()=>{
  const text="The yellow bird rests in the garden. Children carry apples to school.";
  const result=generateTextActivity({...setup,source:"passage",skill:"Reading",template:"sentence"},text);
  expect(result).toHaveLength(2);
  for(const row of result!) {
    expect(row.prompt).toContain("___");
    expect(text.toLowerCase()).toContain(row.answers[0]);
    expect(row.english?.skill).toBe("Reading");
  }
});
