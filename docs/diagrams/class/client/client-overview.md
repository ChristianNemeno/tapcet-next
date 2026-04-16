# Client Overview

```mermaid
%%{ init: { 'flowchart': { 'curve': 'linear' } } }%%
flowchart TB
    Home["HomePage"]
    AuthPages["LoginPage / RegisterPage"]
    QuizPages["QuizPage / ResultsPage / LeaderboardPage"]
    AdminPages["DashboardPage / AdminPage"]
    Navbar["Navbar"]
    Auth["AuthProvider"]
    Api["ApiClient"]
    Types["Shared Types"]

    Navbar --> Auth
    AuthPages --> Auth
    QuizPages --> Auth
    AdminPages --> Auth

    Home --> Api
    QuizPages --> Api
    AdminPages --> Api
    AuthPages --> Api

    Api --> Types
    Home --> Types
    QuizPages --> Types
    AdminPages --> Types
```
