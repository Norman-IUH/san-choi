import {expect,test} from "vitest";
import {liveGrade,livePoints,liveQuestion,topRanks} from "../lib/live";

test("live options do not expose the key and the server calculates the answer",()=>{
  const item={prompt:"Pick a fruit",options:["apple","bus","train"],answers:["apple"]};
  expect(liveQuestion(item,{})).not.toHaveProperty("answers");
  expect(liveGrade("quiz",item,[0])).toBe(true);
  expect(liveGrade("quiz",item,[1])).toBe(false);
  expect(liveGrade("quiz",item,[0,0])).toBeNull();
  expect(liveGrade("quiz",item,[9])).toBeNull();
});

test("streaks count consecutive correct questions and top ranks omit zero scores",()=>{
  expect(livePoints([0,1,2,4,5].map(question=>({question,correct:true})))).toEqual({points:6,best:3,bonus:1});
  expect(topRanks([{label:"Bạn 1",points:3},{label:"Bạn 2",points:0},{label:"Bạn 3",points:3}])
    .map(row=>[row.label,row.rank])).toEqual([["Bạn 1",1],["Bạn 3",1]]);
});
