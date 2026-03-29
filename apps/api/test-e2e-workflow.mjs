async function testWorkflow() {
    const baseURL = 'http://localhost:3001/api';
    const headers = {
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': 'demo'
    };

    const fetchAPI = async (path, options = {}) => {
        const res = await fetch(`${baseURL}${path}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(data));
        return data.data;
    };

    try {
        console.log('--- DEBUT DU TEST E2E ---');
        console.log('1. Connexion admin...');
        const loginRes = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@harmony-erp.com', password: 'Admin@123' })
        });
        const token = loginRes.accessToken;
        if (!token) throw new Error("No token returned");
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Connecté avec succès');

        console.log('\n2. Prétraitement - Départements et Grades...');
        const depsRes = await fetchAPI('/departments');
        const gradesRes = await fetchAPI('/grades');
        const deptId = depsRes[0]?.id;
        const gradeId = gradesRes[0]?.id;

        if (!deptId || !gradeId) throw new Error("Département ou grade manquant.");
        console.log(`✅ IDs récupérés: Dépt ${deptId}, Grade ${gradeId}`);

        console.log('\n3. Création dun Employé...');
        const empNum = Math.floor(Math.random() * 10000);
        const empRes = await fetchAPI('/employees', {
            method: 'POST',
            body: JSON.stringify({
                firstName: 'E2E',
                lastName: `User${empNum}`,
                email: `e2e${empNum}@company.com`,
                position: 'Testeur QA',
                contractType: 'CDI',
                baseSalary: 60000,
                hireDate: new Date().toISOString(),
                departmentId: deptId,
                gradeId: gradeId
            })
        });
        const employeeId = empRes.id;
        console.log(`✅ Employé créé avec l'ID: ${employeeId}`);

        console.log('\n4. Récupération Profil Complet...');
        const profileRes = await fetchAPI(`/employees/${employeeId}`);
        console.log('✅ Profil récupéré.');
        console.log('   Timeline entries:', profileRes.timeline?.length);
        console.log('   Leaves count:', profileRes.leaves?.length);
        console.log('   Payrolls count:', profileRes.payslips?.length);

        console.log('\n✅ TEST E2E COMPLET TERMINE ET VALIDE ✅');

    } catch (e) {
        console.error('\n❌ ERREUR LORS DU TEST E2E:');
        console.error(e.message);
        process.exit(1);
    }
}

testWorkflow();
