-- 1) Every time a user watches a class we log her progress here
CREATE TABLE user_class_progress (
    id               uuid          PRIMARY KEY,
    user_id          uuid          NOT NULL,        -- FK → study_plans.id
    class_id         text          NOT NULL,        -- FK → classes_dataset.class_id
    watched_at       timestamptz,
    progress_percent numeric,                      -- 0‑100
    completed        bool          DEFAULT false,
    notes            text,
    last_position    numeric,                      -- seconds or % in video
    created_at       timestamptz   DEFAULT now(),
    updated_at       timestamptz   DEFAULT now(),

    FOREIGN KEY (user_id)  REFERENCES study_plans (id),
    FOREIGN KEY (class_id) REFERENCES classes_dataset (class_id)
);

-- 2) Canonical list of every video class you own
CREATE TABLE classes_dataset (
    class_id        text  PRIMARY KEY,             -- human‑readable or UUID
    subject_name    text,
    subject_id      int8,
    sub_subject_name text,
    sub_subject_id  int8,
    class_name      text,
    class_order     int8,                          -- order inside the sub‑subject
    link            text,                          -- YouTube/Vimeo/S3…
    duration        int8                           -- minutes (or seconds)
);

-- 3) One record per learner (your “study‑plan profile”)
CREATE TABLE study_plans (
    id                 uuid        PRIMARY KEY,
    name               text,
    created_at         timestamptz DEFAULT now(),
    updated_at         timestamptz DEFAULT now(),
    location           text,
    faculdade          text,
    curso              text,
    horarios_estudo    text,   -- preferred daily slots
    horas_por_dia      text,   -- e.g. '3'
    data_enem          text,   -- string in diagram; consider DATE
    grau_escolaridade  text,
    data_de_nascimento date,
    sugestoes          text
);

-- 4) Concrete calendar events the AI/UX schedules for a user
CREATE TABLE scheduled_classes (
    id                  uuid        PRIMARY KEY,
    date                text,           -- string in diagram; use DATE if you can
    hour_start          time,
    subject             text,
    link                text,
    updated_at          timestamptz,
    hour_finish         time,
    started             text,           -- e.g. 'yes' / timestamp / null
    score               numeric,        -- user feedback
    percentage_complete numeric,
    "user"              uuid,           -- FK → study_plans.id  (column name as shown)
    week                text,

    FOREIGN KEY ("user") REFERENCES study_plans (id)
);

-- 5) Granular timetable blocks for multi‑hour study sessions
CREATE TABLE subject_calendar (
    id            int8  PRIMARY KEY,        -- auto‑increment
    scheduled_id  uuid  NOT NULL,           -- FK → scheduled_classes.id
    start_time    time,
    finish_time   time,
    date_calendar date,
    subject       text,

    FOREIGN KEY (scheduled_id) REFERENCES scheduled_classes (id)
);

-- 6) Junction table linking a “study session” 
--    to every class that was covered in that session
CREATE TABLE session_classes (
    id         int8 PRIMARY KEY,
    class_idd  text NOT NULL,  -- FK → classes_dataset.class_id   (name in diagram)
    session_id int8 NOT NULL   -- FK → sessions(id)  -- sessions table not drawn

    -- add the FK once the sessions table exists
    -- FOREIGN KEY (session_id) REFERENCES sessions (id)
);



How the pieces fit together (plain‑language)

Table	What it represents	Key columns	Main foreign‑key links
study_plans	A learner’s profile / study‑plan metadata. One row per user.	id (PK)	Referenced by user_class_progress.user_id and scheduled_classes.user.
classes_dataset	Master catalog of every video class you host (subject hierarchy, title, video link, etc.).	class_id (PK), subject_id, sub_subject_id, class_order	Referenced by user_class_progress.class_id and session_classes.class_idd.
user_class_progress	Per‑user per‑class progress tracker (watched %, completed flag, last playback position…).	id (PK), progress_percent, completed	FK → study_plans (user_id), FK → classes_dataset (class_id).
scheduled_classes	A dated appointment telling a user when to study what (think “calendar event” with a link to the video).	id (PK), date, hour_start, hour_finish, subject, percentage_complete	FK → study_plans (user).
subject_calendar	Breaks a long scheduled class into fine‑grained time blocks. Lets you show a timeline or drag‑and‑drop timetable UI.	id (PK), scheduled_id, start_time, finish_time	FK → scheduled_classes.id.
session_classes	A many‑to‑many bridge between a session (in‑person, Zoom, group study) and the individual video classes that were covered.	id (PK), class_idd, session_id	FK → classes_dataset.class_id. session_id would reference a sessions table (not in the image).
Relationship diagram in words
pgsql
Copy
Edit
study_plans 1⟶∞ scheduled_classes
study_plans 1⟶∞ user_class_progress
classes_dataset 1⟶∞ user_class_progress
classes_dataset 1⟶∞ session_classes
scheduled_classes 1⟶∞ subject_calendar
session (?) 1⟶∞ session_classes            -- session table not shown
Dashed lines in the diagram correspond to those FOREIGN KEY constraints.

Every major entity (study_plans, classes_dataset) can fan out to many child rows, giving you the flexibility to query progress, schedules, and historical sessions from multiple angles.

That should give your assistant (and your devs) the full picture of the current schema plus ready‑to‑run DDL you can paste into Supabase’s SQL editor (remember to disable RLS if that’s the plan). Let me know if you’d like naming clean‑ups, additional indexes, or sample queries!