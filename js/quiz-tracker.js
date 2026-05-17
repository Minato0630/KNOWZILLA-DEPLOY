(async function() {
    // Read local results from sessionStorage
    const results = JSON.parse(sessionStorage.getItem('quizResults'));
    if (!results || results.submitted) return;

    // Detect subject from URL filename
    const pathParts = window.location.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // e.g. pythonresults1.html -> PYTHON
    let subject = fileName
        .replace('results', '')
        .replace('quiz', '')
        .replace('1', '')
        .replace('.html', '')
        .toUpperCase();
    
    if (subject === 'C++') subject = 'C++';
    else if (subject === 'C') subject = 'C';
    else if (!subject) subject = 'GENERAL';

    // Route to port 5000 if static website is running on another port
    const API_BASE = (window.location.port && window.location.port !== '5000') || window.location.protocol === 'file:' 
        ? 'http://localhost:5000' 
        : '';

    try {
        const res = await fetch(API_BASE + '/api/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: subject,
                score: Number(results.numCorrect),
                total: Number(results.totalQuestions),
                percentage: parseFloat(results.percentage)
            }),
            credentials: 'include'
        });
        
        const data = await res.json();
        if (data.success) {
            // Prevent duplicate submissions on reload
            results.submitted = true;
            sessionStorage.setItem('quizResults', JSON.stringify(results));
            console.log('✅ Quiz score submitted to leaderboard successfully.');
        }
    } catch (err) {
        console.error('❌ Error submitting quiz score:', err);
    }
})();
