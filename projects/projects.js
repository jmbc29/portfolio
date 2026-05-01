import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `${projects.length} Projects`;
renderProjects(projects, projectsContainer, 'h2');

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();

    const rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    const data = rolledData.map(([year, count]) => ({
        value: count,
        label: year,
    }));

    const sliceGenerator = d3.pie().value((d) => d.value);
    const arcData = sliceGenerator(data);
    const arcs = arcData.map((d) => arcGenerator(d));

    arcs.forEach((arc, i) => {
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('class', selectedIndex === i ? 'selected' : '')
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;

                svg.selectAll('path').attr('class', (_, idx) =>
                    idx === selectedIndex ? 'selected' : ''
                );

                legend.selectAll('li').attr('class', (_, idx) =>
                    idx === selectedIndex ? 'legend-item selected' : 'legend-item'
                );

                if (selectedIndex === -1) {
                    renderProjects(projects, projectsContainer, 'h2');
                } else {
                    const selectedYear = data[selectedIndex].label;
                    const filtered = projects.filter((p) => p.year === selectedYear);
                    renderProjects(filtered, projectsContainer, 'h2');
                }
            });
    });

    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    selectedIndex = -1;

    const filteredProjects = projects.filter((project) => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});