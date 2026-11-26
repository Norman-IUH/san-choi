import { test, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

test("migration provisions accounts, locks teacher rows and allows one authoritative completion", async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  const student = "33333333-3333-4333-8333-333333333333";
  const assignment = "44444444-4444-4444-8444-444444444444";
  const attempt = "55555555-5555-4555-8555-555555555555";
  const session = (user: string) => db.exec(`reset role; set request.jwt.claim.sub = '${user}'; set role authenticated;`);
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;
    `);
    await db.exec(await readFile("supabase/migrations/20261114113207_foundation.sql", "utf8"));
    await db.exec(await readFile("supabase/migrations/20261126104943_attempt_rate_limits.sql", "utf8"));
    await db.exec(`insert into auth.users values ('${owner}'),('${other}'),('${student}');
      update profiles set role='student' where id='${student}';`);
    await session(owner);
    const folder = (await db.query<{id: string}>("insert into folders(name) values ('Một') returning id")).rows[0].id;
    const activity = (await db.query<{id: string}>(
      "insert into activities(title,template,content,folder_id) values ('Câu hỏi','quiz','[]',$1) returning id", [folder])).rows[0].id;
    expect((await db.query("select * from activity_versions")).rows).toHaveLength(1);
    await expect(db.query("update profiles set role='admin'")).rejects.toThrow(/permission denied/);
    await session(other);
    expect((await db.query("select * from activities")).rows).toHaveLength(0);
    expect((await db.query("select * from activity_versions")).rows).toHaveLength(0);
    await expect(db.query("insert into activities(title,template,content,folder_id) values ('Test','quiz','[]',$1)", [folder])).rejects.toThrow(/foreign key/);
    await session(student);
    await expect(db.query("insert into activities(title,template,content) values ('Test','quiz','[]')")).rejects.toThrow(/row-level security/);
    await db.exec(`reset role; insert into assignments(id,owner_id,activity_id,title,template,content)
      values ('${assignment}','${owner}','${activity}','Snapshot','quiz','[]');
      insert into attempts(id,assignment_id,nickname) values ('${attempt}','${assignment}','Học sinh');`);
    await session(other);
    expect((await db.query("select * from assignments")).rows).toHaveLength(0);
    expect((await db.query("select * from attempts")).rows).toHaveLength(0);
    await expect(db.query("select * from finish_attempt($1,$2,'[]',1,2)", [assignment,attempt])).rejects.toThrow(/permission denied/);
    const scope = "a".repeat(64);
    await expect(db.query("select consume_attempt_limit('start',$1)", [scope])).rejects.toThrow(/permission denied/);
    await db.exec("reset role; set role anon;");
    await expect(db.query("select * from activities")).rejects.toThrow(/permission denied/);
    await db.exec("reset role; set role service_role;");
    const useLimit = (operation: string) => db.query<{ allowed: boolean }>(
      "select consume_attempt_limit($1,$2) as allowed", [operation, scope]);
    expect((await useLimit("start")).rows[0].allowed).toBe(true);
    await db.query("update private.attempt_rate_limits set hits=179 where operation='start' and scope=$1", [scope]);
    expect((await useLimit("start")).rows[0].allowed).toBe(true);
    expect((await useLimit("start")).rows[0].allowed).toBe(false);
    expect((await useLimit("finish")).rows[0].allowed).toBe(true);
    await db.query("update private.attempt_rate_limits set hits=239 where operation='finish' and scope=$1", [scope]);
    expect((await useLimit("finish")).rows[0].allowed).toBe(true);
    expect((await useLimit("finish")).rows[0].allowed).toBe(false);
    await db.query("update private.attempt_rate_limits set window_start=now()-interval '2 minutes' where operation='start' and scope=$1", [scope]);
    expect((await useLimit("start")).rows[0].allowed).toBe(true);
    const finish = (score: number) => db.query<{score: number}>("select score from finish_attempt($1,$2,'[]',$3,2)", [assignment,attempt,score]);
    expect((await finish(1)).rows[0].score).toBe(1);
    expect((await finish(2)).rows[0].score).toBe(1);
    await db.query("update assignments set deadline=now()-interval '1 second' where id=$1", [assignment]);
    await expect(finish(1)).rejects.toThrow(/assignment closed/);
    await session(owner);
    await db.query("update activities set title='Tên mới' where id=$1", [activity]);
    expect((await db.query("select title from assignments")).rows[0]).toEqual({ title: "Snapshot" });
    await db.query("delete from folders where id=$1", [folder]);
    expect((await db.query("select folder_id from activities")).rows[0]).toEqual({ folder_id: null });
  } finally {
    await db.close();
  }
}, 20000);
