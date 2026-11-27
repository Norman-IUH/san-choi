import { test, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

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
    await db.exec(await readFile("supabase/migrations/20261126155849_secure_game_sessions.sql", "utf8"));
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
    await expect(db.query("select hangman_guess($1,$2,0,'A')", [assignment, attempt])).rejects.toThrow(/permission denied/);
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
    await useLimit("media");
    await db.query("update private.attempt_rate_limits set hits=29 where operation='media' and scope=$1", [scope]);
    expect((await useLimit("media")).rows[0].allowed).toBe(true);
    expect((await useLimit("media")).rows[0].allowed).toBe(false);
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
    const puzzleAttempt = "66666666-6666-4666-8666-666666666666";
    await db.exec(`reset role; update assignments set template='hangman', deadline=null,
      content='[{"prompt":"Animal","answers":["CAT"]}]' where id='${assignment}';
      insert into attempts(id,assignment_id,nickname) values ('${puzzleAttempt}','${assignment}','Hangman'); set role service_role;`);
    const guess = async (letter: string | null) => (await db.query<{ guesses: string | null }>(
      "select hangman_guess($1,$2,0,$3) as guesses", [assignment, puzzleAttempt, letter])).rows[0].guesses;
    expect(await guess("ABC")).toBeNull();
    expect(await guess("B\n")).toBeNull();
    expect(await guess("B")).toBe("B");
    expect(await guess("B")).toBe("B");
    for (const letter of "DEFGH") await guess(letter);
    expect(await guess("C")).toBe("BDEFGH");
    expect(await guess(null)).toBe("BDEFGH");
    await db.query("update assignments set closed=true where id=$1", [assignment]);
    expect(await guess(null)).toBeNull();
    await db.exec("reset role");
    const migrationFiles = await readdir("supabase/migrations");
    const libraryMigration = migrationFiles.find(file => file.endsWith("_english_learning_library.sql"))!;
    await db.exec(await readFile("supabase/migrations/" + libraryMigration, "utf8"));
    await session(owner);
    expect((await db.query("select vocabulary_lesson_id from activities where id=$1", [activity])).rows[0])
      .toEqual({ vocabulary_lesson_id: null });
    const word = (await db.query<{ id: string }>(
      "insert into vocabulary_entries(word,meaning,level,topic) values ('book','sách','Kids','School') returning id")).rows[0].id;
    const lesson = (await db.query<{ id: string }>(
      "insert into vocabulary_lessons(title,level,skill,topic,unit,difficulty,entry_keys) values ('Read','Kids','Vocabulary','School','Unit 1','gentle',array[$1::text]) returning id",
      [word])).rows[0].id;
    await db.query("insert into activities(title,template,content,vocabulary_lesson_id) values ('Read','quiz','[]',$1)", [lesson]);
    await expect(db.query("update activities set vocabulary_lesson_id=$1 where id=$2", [lesson, activity])).rejects.toThrow(/permission denied/);
    await expect(db.query("update vocabulary_entries set uk=$1", [other + "/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa.wav"])).rejects.toThrow(/check constraint/);
    await session(other);
    expect((await db.query("select id from vocabulary_entries")).rows).toHaveLength(0);
    expect((await db.query("select id from vocabulary_lessons")).rows).toHaveLength(0);
    await expect(db.query("insert into activities(title,template,content,vocabulary_lesson_id) values ('Test','quiz','[]',$1)", [lesson]))
      .rejects.toThrow(/foreign key/);
    await session(student);
    await expect(db.query("insert into vocabulary_entries(word,meaning,level,topic) values ('book','sách','Kids','School')"))
      .rejects.toThrow(/row-level security/);
    await db.exec("reset role; set role anon;");
    await expect(db.query("select id from vocabulary_entries")).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
    const archiveMigration = migrationFiles.find(file => file.endsWith("_vocabulary_archive.sql"))!;
    await db.exec(await readFile("supabase/migrations/" + archiveMigration, "utf8"));
    await session(owner);
    await db.query("update vocabulary_entries set archived_at=now() where id=$1", [word]);
    expect((await db.query("select id from vocabulary_entries where id=$1 and archived_at is not null", [word])).rows).toHaveLength(1);
    expect((await db.query("select entry_keys from vocabulary_lessons where id=$1", [lesson])).rows).toEqual([{ entry_keys: [word] }]);
    await expect(db.query("insert into activities(title,template,content,visibility) values ('Private key','quiz','[{\"practice\":{}}]','public')"))
      .rejects.toThrow(/practice_activities_private/);
  } finally {
    await db.close();
  }
}, 20000);
