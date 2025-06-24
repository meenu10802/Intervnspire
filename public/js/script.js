console.log('Script loaded');
const images = [
    { src: '/images/your-art.jpg', alt: 'Your Artwork Description' },
    
];
function loadSection(topic) {
    console.log(`Loading section: ${topic}`);
    const sections = ['dbms', 'networking', 'webdev', 'programming'];

    // Loop                                 
    sections.forEach(sectionTopic => {//(if sectionTopic = "dbms", it tries to get the element with ID dbms-section)

        //variable that stores the actual DOM element (the HTML <section>)
        const section = document.getElementById(`${sectionTopic}-section`); 
        section.style.display = sectionTopic === topic ? 'block' : 'none';
        if (sectionTopic === topic) updateProgress(sectionTopic);
    });
    updateOverallProgress();
}

async function updateProgress(topic) {
    console.log(`Updating progress for ${topic}`);
    try {
        const response = await fetch(`/api/questions/progress/${topic}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch progress');
        const data = await response.json();
        document.getElementById(`${topic}-progress-bar`).value = data.progress;
        document.getElementById(`${topic}-progress-text`).textContent = `Progress: ${Math.round(data.progress)}%`;
    } catch (err) {
        console.error('Error fetching progress:', err.message);
    }
}

async function updateOverallProgress() {
    console.log('Updating overall progress');
    try {
        const response = await fetch('/api/questions/overall-progress', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch overall progress');
        const data = await response.json();
        document.getElementById('overall-progress-bar').value = data.progress;
        document.getElementById('overall-progress-text').textContent = `Overall Progress: ${Math.round(data.progress)}%`;
    } catch (err) {
        console.error('Error fetching overall progress:', err.message);
    }
}