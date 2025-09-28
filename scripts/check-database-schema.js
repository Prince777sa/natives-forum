// scripts/check-database-schema.js - Check database tables and schema
const { Pool } = require('pg');

async function checkDatabaseSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking database schema...\n');

    // Get all tables
    const tablesQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);

    console.log('📋 Available Tables:');
    console.log('==================');
    tablesResult.rows.forEach(row => {
      console.log(`• ${row.table_name} (${row.table_type})`);
    });

    console.log('\n📊 Table Details:');
    console.log('=================');

    // Get column details for each table
    for (const table of tablesResult.rows) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`\n🔸 Table: ${table.table_name}`);

        const columnsQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;

        const columnsResult = await pool.query(columnsQuery, [table.table_name]);

        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });

        // Get row count
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
          console.log(`  📊 Rows: ${countResult.rows[0].count}`);
        } catch (error) {
          console.log(`  📊 Rows: Could not count (${error.message})`);
        }
      }
    }

    // Check for indexes
    console.log('\n🔑 Indexes:');
    console.log('===========');
    const indexQuery = `
      SELECT
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname NOT LIKE 'pg_%'
      ORDER BY t.relname, i.relname;
    `;

    const indexResult = await pool.query(indexQuery);
    const indexesByTable = {};

    indexResult.rows.forEach(row => {
      if (!indexesByTable[row.table_name]) {
        indexesByTable[row.table_name] = {};
      }
      if (!indexesByTable[row.table_name][row.index_name]) {
        indexesByTable[row.table_name][row.index_name] = [];
      }
      indexesByTable[row.table_name][row.index_name].push(row.column_name);
    });

    Object.keys(indexesByTable).forEach(tableName => {
      console.log(`\n🔸 Table: ${tableName}`);
      Object.keys(indexesByTable[tableName]).forEach(indexName => {
        const columns = indexesByTable[tableName][indexName].join(', ');
        console.log(`  - ${indexName}: (${columns})`);
      });
    });

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();