-- Create error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    user_message TEXT NOT NULL,
    error_code VARCHAR(50),
    context JSONB,
    stack_trace TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    user_agent TEXT,
    url TEXT,
    method VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    user_agent TEXT,
    url TEXT,
    method VARCHAR(10),
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_id ON system_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Users can view error logs for their tenant" ON error_logs
    FOR SELECT USING (
        tenant_id::text = (auth.jwt() ->> 'tenant_id') OR
        auth.jwt() ->> 'role' = 'super_admin'
    );

CREATE POLICY "Service role can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for system_logs
CREATE POLICY "Users can view system logs for their tenant" ON system_logs
    FOR SELECT USING (
        tenant_id::text = (auth.jwt() ->> 'tenant_id') OR
        auth.jwt() ->> 'role' = 'super_admin'
    );

CREATE POLICY "Service role can insert system logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- Create function to clean old logs
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete error logs older than 30 days
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete system logs older than 7 days (except CRITICAL and ERROR)
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND level NOT IN ('CRITICAL', 'ERROR');
    
    -- Delete old CRITICAL and ERROR logs after 30 days
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND level IN ('CRITICAL', 'ERROR');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean old logs (runs daily)
SELECT cron.schedule(
    'clean-old-logs',
    '0 2 * * *', -- 2 AM daily
    'SELECT clean_old_logs();'
);
