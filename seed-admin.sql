INSERT INTO User (id, name, username, password, role, isActive, createdAt)
VALUES ('ckv' || hex(randomblob(10)), 'Janwari Admin', 'admin', '$2b$12$pLvC9H4.uPP.yFyzJl4sm5h57KkoK/Z1yr3FTb87bkk4', 'ADMIN', 1, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO NOTHING;
