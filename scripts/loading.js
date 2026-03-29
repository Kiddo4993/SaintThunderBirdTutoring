// Generate Stars
        function generateStars() {
            const starsField = document.getElementById('starsField');
            for (let i = 0; i < 150; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.opacity = Math.random() * 0.7 + 0.3;
                starsField.appendChild(star);
            }
        }

        // Generate Grid Lines
        function generateGrid() {
            const gridContainer = document.createElement('div');
            gridContainer.className = 'grid-lines';
            
            for (let i = 0; i < 10; i++) {
                const line = document.createElement('div');
                line.className = 'grid-line-h';
                line.style.top = (i * 10) + '%';
                gridContainer.appendChild(line);
            }

            for (let i = 0; i < 10; i++) {
                const line = document.createElement('div');
                line.className = 'grid-line-v';
                line.style.left = (i * 10) + '%';
                gridContainer.appendChild(line);
            }

            document.querySelector('.loading-container').appendChild(gridContainer);
        }

        generateStars();
        generateGrid();

        // Flag to prevent multiple redirects
        let isRedirecting = false;

        // Function to handle redirect
        function goToMainPage() {
            if (isRedirecting) return; // Prevent multiple redirects
            isRedirecting = true;
            
            const container = document.getElementById('loadingContainer');
            if (container) {
                container.classList.add('exit');
            }
            
            setTimeout(() => {
                // Set flag BEFORE redirecting to prevent loop
                localStorage.setItem('skip_intro', 'true');
                window.location.replace('index.html');
            }, 1000);
        }

        // Auto-redirect after 5 seconds
        setTimeout(() => {
            goToMainPage();
        }, 5000);

        // Skip on Click
        document.body.addEventListener('click', () => {
            goToMainPage();
        });

        // Skip on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                goToMainPage();
            }
        });
