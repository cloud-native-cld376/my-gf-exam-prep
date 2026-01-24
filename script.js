let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStarted = false;
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Start timer
function startTimer() {
    startTime = Date.now();
    elapsedTime = 0;
    const timerDisplay = document.getElementById('timerText');
    
    timerInterval = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = formatTime(elapsedTime);
    }, 1000);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Quiz list (add new quizzes here)
const quizzes = [
    {
        id: 'atom',
        emoji: '⚛️',
        title: 'Atom',
        description: 'Atoms, molecules, elements & compounds',
        file: 'data/atom.json',
    },
    {
        id: 'biophysics',
        emoji: '🧬',
        title: 'Biophysics',
        description: 'Biophysics fundamentals',
        file: 'data/bioPhysic.json',
    },
    {
        id: 'ict',
        emoji: '💻',
        title: 'ICT',
        description: 'Information and Communication Technology',
        file: 'data/ict.json',
    },
    {
        id: 'biology',
        emoji: '🌱',
        title: 'Biology',
        description: 'Plant biology, cells, leaves, roots & stems',
        file: 'data/biology.json',
    },
];

function renderQuizOptions() {
    const container = document.getElementById('quizOptions');
    if (!container) return;

    container.innerHTML = quizzes
        .map(
            (q, idx) => `
            <div class="quiz-option-card" data-quiz="${q.file}">
                <h3>${q.emoji} Quiz ${idx + 1}: ${q.title}</h3>
                <p class="quiz-description">${q.description}</p>
                <p class="quiz-count"><span class="quiz-count-number" data-file="${q.file}">0</span> questions</p>
                <button class="btn btn-select-quiz" type="button">Select This Quiz</button>
            </div>
        `
        )
        .join('');

    // Click handlers
    container.querySelectorAll('.btn-select-quiz').forEach((btn) => {
        btn.addEventListener('click', function () {
            const quizCard = this.closest('.quiz-option-card');
            const quizFile = quizCard?.getAttribute('data-quiz');
            if (quizFile) selectQuiz(quizFile);
        });
    });
}

// Load quiz counts for selection screen
async function loadQuizCounts() {
    await Promise.all(
        quizzes.map(async (q) => {
            try {
                const res = await fetch(q.file);
                const data = await res.json();
                const countEl = document.querySelector(`[data-file="${q.file}"]`);
                if (countEl) countEl.textContent = data.length;
            } catch (e) {
                console.error('Error loading quiz count for', q.file, e);
            }
        })
    );
}

// Load selected quiz data
async function loadQuizData(quizFile) {
    try {
        const response = await fetch(quizFile);
        quizData = await response.json();
        document.getElementById('totalQuestionsInfo').textContent = quizData.length;
        document.getElementById('totalQuestions').textContent = quizData.length;
        const quizMeta = quizzes.find((q) => q.file === quizFile);
        const quizName = quizMeta ? `${quizMeta.title}` : 'this';
        document.getElementById('selectedQuizTitle').textContent =
            `Ready for ${quizName} quiz, babe? I’m right here cheering for you! 💕`;
        return true;
    } catch (error) {
        console.error('Error loading quiz data:', error);
        alert('Error loading quiz data. Please try again.');
        return false;
    }
}

// Handle quiz selection
function selectQuiz(quizFile) {
    loadQuizData(quizFile).then(success => {
        if (success) {
            document.getElementById('quizSelectionScreen').style.display = 'none';
            document.getElementById('startScreen').style.display = 'block';
        }
    });
}

function startQuiz() {
    // Hide start screen and show quiz
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('timerDisplay').style.display = 'block';
    
    // Initialize quiz
    userAnswers = {};
    currentQuestionIndex = 0;
    quizStarted = true;
    
    // Start timer
    startTimer();
    
    // Clear confetti
    document.getElementById('confetti-container').innerHTML = '';
    
    displayQuestion();
    updateProgress();
}

function initializeQuiz() {
    userAnswers = {};
    currentQuestionIndex = 0;
    quizStarted = true;
    
    document.getElementById('totalQuestions').textContent = quizData.length;
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('timerDisplay').style.display = 'block';
    
    // Clear confetti
    document.getElementById('confetti-container').innerHTML = '';
    
    // Restart timer
    startTimer();
    
    displayQuestion();
    updateProgress();
}

function displayQuestion() {
    const question = quizData[currentQuestionIndex];
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    
    questionText.textContent = question.question;
    answersContainer.innerHTML = '';

    // Support both schemas:
    // - old: { answer: [...] }
    // - new: { answers: [...] }
    const answerList = question.answers || question.answer || [];

    answerList.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        if (userAnswers[currentQuestionIndex] === answer) {
            answerDiv.classList.add('selected');
        }
        answerDiv.textContent = answer;
        answerDiv.addEventListener('click', () => selectAnswer(answer));
        answersContainer.appendChild(answerDiv);
    });
    
    updateNavigationButtons();
}

function selectAnswer(answer) {
    userAnswers[currentQuestionIndex] = answer;
    
    // Update visual selection
    const options = document.querySelectorAll('.answer-option');
    options.forEach(option => {
        option.classList.remove('selected');
        if (option.textContent === answer) {
            option.classList.add('selected');
            // Add a little bounce animation
            option.style.animation = 'none';
            setTimeout(() => {
                option.style.animation = 'fadeIn 0.3s ease';
            }, 10);
        }
    });
    
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateProgress();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateProgress();
    }
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    
    // Update encouragement messages based on progress
    const encouragementText = document.getElementById('encouragementText');
    const progressPercent = Math.round(progress);
    
    if (progressPercent === 100) {
        encouragementText.textContent = "Almost done, babe! I'm so proud of you! 🌟💕";
    } else if (progressPercent >= 75) {
        encouragementText.textContent = "You're doing so well, sweetheart! Keep going! 💪✨";
    } else if (progressPercent >= 50) {
        encouragementText.textContent = "Halfway there, beautiful! You're amazing! 🎯💖";
    } else if (progressPercent >= 25) {
        encouragementText.textContent = "Great start, babe! I'm cheering for you! 🌸💕";
    } else {
        encouragementText.textContent = "I believe in you, Monika! You've got this! 💪💖";
    }
}

function createConfetti() {
    const colors = ['#ff6b9d', '#ff8fab', '#ffb3d1', '#ffc0cb', '#ffd9e6', '#ffe0e6'];
    const container = document.getElementById('confetti-container');
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        container.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function getMotivationalMessage(scorePercentage) {
    if (scorePercentage >= 90) {
        return {
            message: "🎉 I'm SO proud of you, babe! You're absolutely incredible! 🌟💕",
            class: "excellent",
            celebration: "🎊🎉✨ YOU'RE AMAZING, BABE! ✨🎉🎊"
        };
    } else if (scorePercentage >= 80) {
        return {
            message: "🎊 Wow, sweetheart! You did fantastic! I'm so proud of you! 🌸💖",
            class: "excellent",
            celebration: "🌟✨ YOU DID GREAT, BABE! ✨🌟"
        };
    } else if (scorePercentage >= 70) {
        return {
            message: "💪 You did really well, babe! I'm proud of you! Keep it up! 💕",
            class: "good",
            celebration: "👏 Nice work, sweetheart! 👏"
        };
    } else if (scorePercentage >= 60) {
        return {
            message: "👍 Good job, babe! Every step forward counts! I believe in you! 💕",
            class: "good",
            celebration: "💪 Keep going, beautiful! 💪"
        };
    } else if (scorePercentage >= 50) {
        return {
            message: "💖 Hey, you're learning and that's what matters most! I'm proud of you for trying, babe! 🌟💕",
            class: "encouraging",
            celebration: "🌱 You're growing, sweetheart! 🌱"
        };
    } else {
        return {
            message: "💝 Don't worry, babe! Everyone starts somewhere. I'm so proud of you for trying! You'll get better, I believe in you! 🌸💖",
            class: "encouraging",
            celebration: "💪 You're brave, beautiful! 💪"
        };
    }
}

function submitQuiz() {
    // Stop timer
    stopTimer();
    
    let correctCount = 0;
    const resultsSummary = document.getElementById('resultsSummary');
    resultsSummary.innerHTML = '';
    
    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
            correctCount++;
        }
        
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        resultItem.innerHTML = `
            <div class="result-question">${index + 1}. ${question.question}</div>
            ${!isCorrect ? `<div class="result-answer user-answer">Your answer: ${userAnswer || 'Not answered'}</div>` : ''}
            <div class="result-answer correct-answer">Correct answer: ${question.correctAnswer}</div>
            <div class="result-status ${isCorrect ? 'correct' : 'incorrect'}">
                ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </div>
        `;
        
        resultsSummary.appendChild(resultItem);
    });
    
    const scorePercentage = Math.round((correctCount / quizData.length) * 100);
    document.getElementById('scorePercentage').textContent = scorePercentage;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('totalCount').textContent = quizData.length;
    
    // Display time taken
    document.getElementById('timeDisplay').textContent = formatTime(elapsedTime);
    
    // Get motivational message
    const motivation = getMotivationalMessage(scorePercentage);
    
    // Update celebration message
    const celebrationMessage = document.getElementById('celebrationMessage');
    celebrationMessage.textContent = motivation.celebration;
    
    // Update motivational message
    const motivationalMessage = document.getElementById('motivationalMessage');
    motivationalMessage.textContent = motivation.message;
    motivationalMessage.className = `motivational-message ${motivation.class}`;
    
    // Update score circle color and class based on performance
    const scoreCircle = document.getElementById('scoreCircle');
    scoreCircle.className = 'score-circle';
    
    if (scorePercentage >= 80) {
        scoreCircle.classList.add('excellent');
        createConfetti();
    } else if (scorePercentage >= 60) {
        scoreCircle.classList.add('good');
    } else {
        scoreCircle.classList.add('encouraging');
    }
    
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('timerDisplay').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartQuiz() {
    // Stop any running timer
    stopTimer();
    
    // Show quiz selection screen again
    document.getElementById('quizSelectionScreen').style.display = 'block';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'none';
    
    quizStarted = false;
    userAnswers = {};
    currentQuestionIndex = 0;
    elapsedTime = 0;
    quizData = [];
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startQuiz);
document.getElementById('nextBtn').addEventListener('click', nextQuestion);
document.getElementById('prevBtn').addEventListener('click', prevQuestion);
document.getElementById('submitBtn').addEventListener('click', submitQuiz);
document.getElementById('restartBtn').addEventListener('click', restartQuiz);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!quizStarted) return;
    
    if (e.key === 'ArrowRight' && currentQuestionIndex < quizData.length - 1) {
        nextQuestion();
    } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        prevQuestion();
    }
});

// Build selection UI + load counts when page loads
renderQuizOptions();
loadQuizCounts();

