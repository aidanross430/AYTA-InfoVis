
# Are You The Asshole?
"Are You The Asshole?" is a website that compares you against Reddit's r/AmITheAsshole community. In a very similar way to popular internet games like "Would You Rather" and "Will You Press The Button?", AYTA provides the player a random Reddit post from r/AmITheAsshole and lets them decide their own verdict on the situation. Then, AYTA will tell you how your answer compares against the wider reddit community. Users are also free to explore visualizations detailing the kinds of judgements our users and Reddit users make about the situations presented, and what factors may be influencing these decisions. This information can provide us insight into how different internet demographics engage with content differently, and how people's perspective of you shift depending on what information you share.

## Building the project

### Prerequisites
* Python 3.11
* Node.js
* [Reddit Dataset for AmItheAsshole Subreddit](https://www.kaggle.com/datasets/jianloongliew/reddit?select=AmItheAsshole.sqlite), from Jian Loong Liew on [Kaggle.com](https://www.kaggle.com/)

### Cloning the repository
First, clone the repository into your working directory
```bash
git clone https://github.com/aidanross430/AYTA-InfoVis.git
```

### Installing Dependencies
You will need to install both the node.js modules and python libraries necessary for this project. To prevent conflicts, it is best to install the python libraries in a virtual environment.
```bash
# Install node modules from repository's root directory
npm install
# Install python libraries from "/backend"
cd \backend
pip install -r requirements.txt
```

### Extract the database file
The default database file is compressed into ayta.db.gz. Extract this file, and make sure the extracted ayta.db file is located in the backend directory.
```bash
# Should look like the following:
\backend\ayta.db
```

### Run the app
Finally, startup the backend with the following command:
```bash
# Start the backend from the backend directory
cd \backend
uvicorn main:app --reload
```
And the frontend with this command:
```bash
# Start the frontend from the project's root directory
npm run dev
```
