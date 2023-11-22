CREATE TABLE Task (
    task_number VARCHAR(10) PRIMARY KEY,
    actual_hours DECIMAL(4, 2),
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE
);
CREATE TABLE TaskEstimate (
    task_number VARCHAR(10),
    time_estimate DECIMAL(4, 2) NOT NULL,
    estimate_notes TEXT,
    FOREIGN KEY (task_number) REFERENCES Task(task_number)
);