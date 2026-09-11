-- LIMS v2 reference DDL
-- PostgreSQL baseline. Adapt schema/UUID generation conventions to the target repository.
-- This file is a reference migration, not a substitute for project-specific Flyway review.

CREATE SCHEMA IF NOT EXISTS scenario;
CREATE SCHEMA IF NOT EXISTS process;

CREATE TABLE IF NOT EXISTS scenario.scn_scenario_pack (
    id uuid PRIMARY KEY,
    tenant_id uuid NULL,
    scenario_key varchar(128) NOT NULL,
    name varchar(256) NOT NULL,
    description text NULL,
    category varchar(64) NULL,
    status varchar(32) NOT NULL DEFAULT 'ACTIVE',
    owner_tenant_id uuid NULL,
    created_at timestamptz NOT NULL,
    created_by uuid NULL,
    updated_at timestamptz NOT NULL,
    updated_by uuid NULL,
    CONSTRAINT uq_scn_pack_key UNIQUE (owner_tenant_id, scenario_key)
);

CREATE TABLE IF NOT EXISTS scenario.scn_scenario_pack_version (
    id uuid PRIMARY KEY,
    scenario_pack_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack(id),
    version_code varchar(64) NOT NULL,
    state varchar(32) NOT NULL,
    business_mode varchar(32) NULL,
    config_schema_version varchar(32) NOT NULL DEFAULT 'v2',
    base_version_id uuid NULL REFERENCES scenario.scn_scenario_pack_version(id),
    change_summary text NULL,
    manifest_json jsonb NULL,
    created_at timestamptz NOT NULL,
    created_by uuid NULL,
    validated_at timestamptz NULL,
    published_at timestamptz NULL,
    published_by uuid NULL,
    lock_version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_scn_pack_version UNIQUE (scenario_pack_id, version_code),
    CONSTRAINT ck_scn_pack_version_state CHECK (state IN ('DRAFT','VALIDATING','READY','PUBLISHED','DEPRECATED','RETIRED'))
);

CREATE INDEX IF NOT EXISTS idx_scn_version_state
    ON scenario.scn_scenario_pack_version(state, published_at DESC);

CREATE TABLE IF NOT EXISTS scenario.scn_setup_step (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    step_key varchar(128) NOT NULL,
    name varchar(256) NOT NULL,
    order_no integer NOT NULL,
    step_type varchar(64) NOT NULL,
    required boolean NOT NULL DEFAULT false,
    depends_on_json jsonb NULL,
    asset_type varchar(64) NULL,
    renderer_key varchar(128) NULL,
    route varchar(512) NULL,
    completion_validator varchar(128) NULL,
    permission_code varchar(128) NULL,
    help_text text NULL,
    config_json jsonb NULL,
    CONSTRAINT uq_scn_setup_step UNIQUE (scenario_version_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_scn_setup_order
    ON scenario.scn_setup_step(scenario_version_id, order_no);

CREATE TABLE IF NOT EXISTS scenario.scn_setup_step_state (
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    step_key varchar(128) NOT NULL,
    completion_state varchar(32) NOT NULL,
    completion_percent integer NOT NULL DEFAULT 0,
    warning_count integer NOT NULL DEFAULT 0,
    error_count integer NOT NULL DEFAULT 0,
    last_checked_at timestamptz NULL,
    PRIMARY KEY (scenario_version_id, step_key),
    CONSTRAINT ck_scn_setup_percent CHECK (completion_percent BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS scenario.scn_asset_binding (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    binding_type varchar(64) NOT NULL,
    target_asset_type varchar(64) NOT NULL,
    target_asset_id uuid NULL,
    target_asset_version_id uuid NULL,
    target_external_ref varchar(256) NULL,
    scope_type varchar(64) NULL,
    scope_key varchar(256) NULL,
    binding_config_json jsonb NULL,
    required boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL,
    created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_scn_asset_binding_version
    ON scenario.scn_asset_binding(scenario_version_id, binding_type);

CREATE INDEX IF NOT EXISTS idx_scn_asset_binding_target
    ON scenario.scn_asset_binding(target_asset_type, target_asset_version_id);

CREATE TABLE IF NOT EXISTS scenario.scn_capability_binding (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    capability_key varchar(128) NOT NULL,
    capability_version varchar(64) NULL,
    required boolean NOT NULL DEFAULT true,
    config_json jsonb NULL,
    CONSTRAINT uq_scn_capability_binding UNIQUE (scenario_version_id, capability_key)
);

CREATE TABLE IF NOT EXISTS scenario.scn_test_capability_binding (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    test_item_version_id uuid NULL,
    test_item_ref varchar(256) NULL,
    subject_type varchar(128) NOT NULL,
    standard_version_id uuid NULL,
    standard_ref varchar(256) NULL,
    method_version_id uuid NULL,
    method_ref varchar(256) NULL,
    limit_rule_version_id uuid NULL,
    limit_rule_ref varchar(256) NULL,
    formula_version_id uuid NULL,
    formula_ref varchar(256) NULL,
    qualification_policy_version_id uuid NULL,
    report_template_version_id uuid NULL,
    report_template_ref varchar(256) NULL,
    equipment_capabilities_json jsonb NULL,
    ai_skill_versions_json jsonb NULL,
    conditions_json jsonb NULL,
    status varchar(32) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_scn_test_cap_scenario
    ON scenario.scn_test_capability_binding(scenario_version_id, subject_type);

CREATE TABLE IF NOT EXISTS scenario.scn_validation_run (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    run_no integer NOT NULL,
    status varchar(32) NOT NULL,
    started_at timestamptz NOT NULL,
    completed_at timestamptz NULL,
    initiated_by uuid NULL,
    summary_json jsonb NULL,
    CONSTRAINT uq_scn_validation_run UNIQUE (scenario_version_id, run_no)
);

CREATE TABLE IF NOT EXISTS scenario.scn_validation_issue (
    id uuid PRIMARY KEY,
    validation_run_id uuid NOT NULL REFERENCES scenario.scn_validation_run(id),
    severity varchar(16) NOT NULL,
    code varchar(128) NOT NULL,
    step_key varchar(128) NULL,
    object_type varchar(64) NULL,
    object_ref varchar(256) NULL,
    message text NOT NULL,
    details_json jsonb NULL,
    CONSTRAINT ck_scn_issue_severity CHECK (severity IN ('ERROR','WARNING','INFO'))
);

CREATE INDEX IF NOT EXISTS idx_scn_issue_run_severity
    ON scenario.scn_validation_issue(validation_run_id, severity);

CREATE TABLE IF NOT EXISTS scenario.scn_scenario_snapshot (
    id uuid PRIMARY KEY,
    scenario_pack_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack(id),
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    snapshot_schema_version varchar(32) NOT NULL,
    canonical_json jsonb NOT NULL,
    snapshot_hash varchar(128) NOT NULL,
    created_at timestamptz NOT NULL,
    created_by uuid NULL,
    CONSTRAINT uq_scn_snapshot_version UNIQUE (scenario_version_id),
    CONSTRAINT uq_scn_snapshot_hash UNIQUE (snapshot_hash)
);

CREATE TABLE IF NOT EXISTS scenario.scn_publish_record (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    snapshot_id uuid NOT NULL REFERENCES scenario.scn_scenario_snapshot(id),
    validation_run_id uuid NOT NULL REFERENCES scenario.scn_validation_run(id),
    published_by uuid NULL,
    published_at timestamptz NOT NULL,
    release_notes text NULL,
    publish_trace_id varchar(128) NULL,
    CONSTRAINT uq_scn_publish_version UNIQUE (scenario_version_id)
);

CREATE TABLE IF NOT EXISTS scenario.scn_activation (
    id uuid PRIMARY KEY,
    scenario_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    tenant_id uuid NOT NULL,
    lab_entity_id uuid NULL,
    org_unit_id uuid NULL,
    effective_from timestamptz NOT NULL,
    effective_to timestamptz NULL,
    enabled boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL,
    created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_scn_activation_runtime
    ON scenario.scn_activation(tenant_id, lab_entity_id, enabled, effective_from, effective_to);

-- Workflow definitions
CREATE TABLE IF NOT EXISTS process.proc_workflow_definition (
    id uuid PRIMARY KEY,
    workflow_key varchar(128) NOT NULL,
    name varchar(256) NOT NULL,
    description text NULL,
    owner_tenant_id uuid NULL,
    created_at timestamptz NOT NULL,
    created_by uuid NULL,
    CONSTRAINT uq_proc_workflow_key UNIQUE (owner_tenant_id, workflow_key)
);

CREATE TABLE IF NOT EXISTS process.proc_workflow_version (
    id uuid PRIMARY KEY,
    workflow_definition_id uuid NOT NULL REFERENCES process.proc_workflow_definition(id),
    version_code varchar(64) NOT NULL,
    state varchar(32) NOT NULL,
    scenario_version_id uuid NULL REFERENCES scenario.scn_scenario_pack_version(id),
    variables_schema_json jsonb NULL,
    checksum varchar(128) NULL,
    created_at timestamptz NOT NULL,
    created_by uuid NULL,
    published_at timestamptz NULL,
    CONSTRAINT uq_proc_workflow_version UNIQUE (workflow_definition_id, version_code)
);

CREATE TABLE IF NOT EXISTS process.proc_workflow_node (
    id uuid PRIMARY KEY,
    workflow_version_id uuid NOT NULL REFERENCES process.proc_workflow_version(id),
    node_key varchar(128) NOT NULL,
    name varchar(256) NOT NULL,
    node_type_key varchar(128) NOT NULL,
    execution_mode varchar(32) NULL,
    config_json jsonb NULL,
    input_mapping_json jsonb NULL,
    output_mapping_json jsonb NULL,
    assignee_policy_json jsonb NULL,
    sla_policy_json jsonb NULL,
    retry_policy_json jsonb NULL,
    incident_policy_json jsonb NULL,
    ui_config_json jsonb NULL,
    position_json jsonb NULL,
    CONSTRAINT uq_proc_workflow_node UNIQUE (workflow_version_id, node_key)
);

CREATE TABLE IF NOT EXISTS process.proc_workflow_edge (
    id uuid PRIMARY KEY,
    workflow_version_id uuid NOT NULL REFERENCES process.proc_workflow_version(id),
    from_node_key varchar(128) NOT NULL,
    to_node_key varchar(128) NOT NULL,
    edge_type varchar(32) NOT NULL DEFAULT 'NORMAL',
    condition_expression text NULL,
    condition_language varchar(32) NULL,
    priority integer NOT NULL DEFAULT 0,
    label varchar(256) NULL
);

CREATE INDEX IF NOT EXISTS idx_proc_edge_from
    ON process.proc_workflow_edge(workflow_version_id, from_node_key, priority);

-- Runtime
CREATE TABLE IF NOT EXISTS process.proc_process_instance (
    id uuid PRIMARY KEY,
    process_no varchar(64) NOT NULL,
    tenant_id uuid NOT NULL,
    lab_entity_id uuid NULL,
    scenario_pack_version_id uuid NOT NULL REFERENCES scenario.scn_scenario_pack_version(id),
    scenario_snapshot_id uuid NOT NULL REFERENCES scenario.scn_scenario_snapshot(id),
    workflow_version_id uuid NOT NULL REFERENCES process.proc_workflow_version(id),
    business_key_type varchar(64) NOT NULL,
    business_key_id uuid NOT NULL,
    status varchar(32) NOT NULL,
    current_summary_json jsonb NULL,
    started_at timestamptz NOT NULL,
    completed_at timestamptz NULL,
    lock_version bigint NOT NULL DEFAULT 0,
    trace_id varchar(128) NULL,
    CONSTRAINT uq_proc_process_no UNIQUE (tenant_id, process_no)
);

CREATE INDEX IF NOT EXISTS idx_proc_instance_business
    ON process.proc_process_instance(tenant_id, business_key_type, business_key_id);

CREATE INDEX IF NOT EXISTS idx_proc_instance_status
    ON process.proc_process_instance(tenant_id, lab_entity_id, status, started_at DESC);

CREATE TABLE IF NOT EXISTS process.proc_node_instance (
    id uuid PRIMARY KEY,
    process_instance_id uuid NOT NULL REFERENCES process.proc_process_instance(id),
    node_key varchar(128) NOT NULL,
    node_type_key varchar(128) NOT NULL,
    status varchar(32) NOT NULL,
    attempt_no integer NOT NULL DEFAULT 1,
    token_id varchar(128) NULL,
    iteration_no integer NOT NULL DEFAULT 0,
    entered_at timestamptz NULL,
    started_at timestamptz NULL,
    waiting_at timestamptz NULL,
    completed_at timestamptz NULL,
    wait_type varchar(32) NULL,
    wait_ref varchar(256) NULL,
    input_snapshot_json jsonb NULL,
    output_json jsonb NULL,
    lock_version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_proc_node_attempt UNIQUE (process_instance_id, node_key, attempt_no, iteration_no)
);

CREATE INDEX IF NOT EXISTS idx_proc_node_waiting
    ON process.proc_node_instance(status, wait_type, wait_ref);

CREATE TABLE IF NOT EXISTS process.proc_node_execution (
    id uuid PRIMARY KEY,
    node_instance_id uuid NOT NULL REFERENCES process.proc_node_instance(id),
    execution_no integer NOT NULL,
    executor_key varchar(128) NOT NULL,
    started_at timestamptz NOT NULL,
    completed_at timestamptz NULL,
    status varchar(32) NOT NULL,
    input_json jsonb NULL,
    output_json jsonb NULL,
    error_code varchar(128) NULL,
    error_message text NULL,
    trace_id varchar(128) NULL,
    idempotency_key varchar(256) NOT NULL,
    CONSTRAINT uq_proc_node_execution_no UNIQUE (node_instance_id, execution_no),
    CONSTRAINT uq_proc_idempotency UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS process.proc_work_item (
    id uuid PRIMARY KEY,
    work_item_no varchar(64) NOT NULL,
    tenant_id uuid NOT NULL,
    lab_entity_id uuid NULL,
    process_instance_id uuid NOT NULL REFERENCES process.proc_process_instance(id),
    node_instance_id uuid NOT NULL REFERENCES process.proc_node_instance(id),
    work_type varchar(128) NOT NULL,
    runtime_renderer_key varchar(128) NULL,
    assignee_user_id uuid NULL,
    candidate_roles_json jsonb NULL,
    candidate_orgs_json jsonb NULL,
    status varchar(32) NOT NULL,
    priority varchar(16) NULL,
    due_at timestamptz NULL,
    payload_schema_key varchar(128) NULL,
    business_refs_json jsonb NULL,
    claimed_at timestamptz NULL,
    completed_at timestamptz NULL,
    lock_version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_proc_work_item_no UNIQUE (tenant_id, work_item_no)
);

CREATE INDEX IF NOT EXISTS idx_proc_my_work
    ON process.proc_work_item(tenant_id, assignee_user_id, status, due_at);

CREATE TABLE IF NOT EXISTS process.proc_process_incident (
    id uuid PRIMARY KEY,
    process_instance_id uuid NOT NULL REFERENCES process.proc_process_instance(id),
    node_instance_id uuid NULL REFERENCES process.proc_node_instance(id),
    incident_type varchar(64) NOT NULL,
    severity varchar(16) NOT NULL,
    error_code varchar(128) NULL,
    message text NOT NULL,
    details_json jsonb NULL,
    status varchar(32) NOT NULL,
    created_at timestamptz NOT NULL,
    resolved_at timestamptz NULL,
    resolved_by uuid NULL,
    resolution_action varchar(64) NULL,
    resolution_reason text NULL
);

-- Registry projections (code remains source of truth)
CREATE TABLE IF NOT EXISTS public.sys_node_type_descriptor (
    node_type_key varchar(128) NOT NULL,
    version varchar(64) NOT NULL,
    name varchar(256) NOT NULL,
    category varchar(64) NULL,
    execution_mode varchar(32) NOT NULL,
    executor_key varchar(128) NULL,
    config_schema_key varchar(128) NULL,
    input_schema_key varchar(128) NULL,
    output_schema_key varchar(128) NULL,
    config_renderer_key varchar(128) NULL,
    runtime_renderer_key varchar(128) NULL,
    source_module varchar(128) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    PRIMARY KEY (node_type_key, version)
);

CREATE TABLE IF NOT EXISTS public.sys_ui_extension_descriptor (
    extension_key varchar(128) NOT NULL,
    extension_type varchar(64) NOT NULL,
    version varchar(64) NOT NULL,
    schema_versions_json jsonb NULL,
    source_module varchar(128) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    PRIMARY KEY (extension_key, version)
);

-- Existing lab tables: execute only after verifying actual schema names.
-- ALTER TABLE lab.lab_test_request ADD COLUMN scenario_pack_id uuid NULL;
-- ALTER TABLE lab.lab_test_request ADD COLUMN scenario_pack_version_id uuid NULL;
-- ALTER TABLE lab.lab_test_request ADD COLUMN scenario_snapshot_id uuid NULL;
-- ALTER TABLE lab.lab_test_request ADD COLUMN process_instance_id uuid NULL;
-- ALTER TABLE lab.lab_test_task ADD COLUMN process_node_instance_id uuid NULL;
-- ALTER TABLE lab.lab_test_task ADD COLUMN work_item_id uuid NULL;

-- Knowledge upgrade reference
CREATE TABLE IF NOT EXISTS public.kb_regulation (
    id uuid PRIMARY KEY,
    tenant_id uuid NULL,
    regulation_code varchar(128) NOT NULL,
    name varchar(512) NOT NULL,
    regulation_type varchar(64) NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT uq_kb_regulation UNIQUE (tenant_id, regulation_code)
);

CREATE TABLE IF NOT EXISTS public.kb_regulation_version (
    id uuid PRIMARY KEY,
    regulation_id uuid NOT NULL REFERENCES public.kb_regulation(id),
    version_code varchar(64) NOT NULL,
    effective_from date NULL,
    effective_to date NULL,
    status varchar(32) NOT NULL,
    source_document_id uuid NULL,
    checksum varchar(128) NULL,
    metadata_json jsonb NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT uq_kb_regulation_version UNIQUE (regulation_id, version_code)
);
