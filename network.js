
function simulate(data,svg)
{
    let width = parseInt(svg.attr("viewBox").split(' ')[2])
    let height = parseInt(svg.attr("viewBox").split(' ')[3])
    let main_group = svg.append("g")
        .attr("transform", "translate(0, 50)")
    
    // Accessing form elements
    let linkStrengthInput = document.getElementById("linkStrength");
    let collideStrengthInput = document.getElementById("collideStrength");
    let chargeStrengthInput = document.getElementById("chargeStrength");
    let nodeSizeOptions = document.getElementsByName("nodeSize");    
    
    // Apply Styling
    svg.style("background-color", "#f4f4f4");   

   //Calculate degree of the nodes:
    let node_degree={}; //initiate an object
   d3.map(data.links,function(d){
       if(node_degree.hasOwnProperty(d.source))
       {
           node_degree[d.source]++;
       }
       else{
           node_degree[d.source]=0;
       }
       if(node_degree.hasOwnProperty(d.target))
       {
           node_degree[d.target]++;
       }
       else{
           node_degree[d.target]=0;
       }
   });
   let scale_radius = d3.scaleLinear()
    .domain(d3.extent(Object.values(node_degree)))
    .range([3,12])
   
   //let color = d3.scaleSequential()
    //.domain([1995,2020])
    //.interpolator(d3.interpolateVirdis);
   
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    //console.log(color.domain()); // Log the unique values (countries) in the color scale domain
    //console.log("Data:", data);
    //console.log("Country and Color:", data.nodes.map(node => ({ country: node.country, color: color(node.country) })));

    //console.log(data.nodes.map(node => node.country));

   
   let link_elements = main_group.append("g")
    .attr('transform',`translate(${width/ 2},${height/ 2})`)
    .selectAll(".line")
    .data(data.links) 
    .enter()
    .append("line")
   
   function treatAuthorsClass (Authors){
    if (Authors){
        let temp=Authors.toString().split(' ').join('');
        temp = temp.split(".").join('');
        temp = temp.split(",").join('');
        temp = temp.split("/").join('');
        return "gr"+temp;
    }
    else{
        // Handle the case where Authors is undefined
        return "undefinedAuthorsClass";

    }

   }
   let node_elements = main_group.append("g")
    .attr('transform',`translate(${width/ 2},${height/ 2})`)
    .selectAll(".circle")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("class",function(d){
        return treatAuthorsClass(d.Authors)})
    
        .on ("mouseover",function (d,data){
            //add title to the info div
            d3.selectAll("#Paper_Title").text(data.id);

            //Show details panel
            d3.select("#detailsPanel").html(`
                <p>Author: ${data.id}</p>
                <p>Country: ${data.country}</p>
                <!-- Add more details as needed -->
            `).style("display", "block");

            //make sure all items are inactive now
            node_elements.classed("inactive",true);

            // get the class of the hovered element
            const selected_class = d3.select(this).attr("class").split(" ")[0];
            //console.log(selected_class)
            
            // make all the hovered elements class active
            d3.selectAll("."+selected_class)
                .classed("inactive",false);

        })
        .on ("mouseout",function(d,data){
            d3.select("#Paper_Title").text("");
            d3.selectAll(".inactive").classed("inactive",false);
        })
    node_elements.append("circle")
        .attr("r",function(d,i){

            if (node_degree[d.id]!==undefined){
                return scale_radius(node_degree[d.id]);

            }
            else{
                return scale_radius(0);
            }
        })  
        .attr("fill",function(d,i){
            return color(d.country);
        })  
    //console.log(data.nodes)

    // Add styling to nodes
    node_elements.selectAll(".circle")
        .style("stroke", "white")
        .style("stroke-width", 1);

    // Add styling to links
    link_elements.style("stroke", "#ccc")
        .style("stroke-width", 1);
    
    // Force Simulation
    let ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius(function (d,i){
                return scale_radius(node_degree[d.id])*1.2}))   
        .force("x",d3.forceX()) 
        .force("y",d3.forceY())
        .force("charge",d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id(function(d){
                return d.id})
            )       
            .on ("tick",ticked);
    function ticked()
    {
        node_elements
            .attr('transform',function(d){return `translate(${d.x},${d.y})` })
            link_elements
                .attr("x1",function(d){return d.source.x})
                .attr("x2",function(d){return d.target.x})
                .attr("y1",function(d){return d.source.y})
                .attr("y2",function(d){return d.target.y})
    }
     // Node drag functionality
     let drag = d3.drag()
     .on("start", dragstarted)
     .on("drag", dragged)
     .on("end", dragended);

    node_elements.call(drag);

    function dragstarted(d) {
        if (d3.event){
            if (!d3.event.active) ForceSimulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

 }

    function dragged(d) {
        if (d3.event){
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        
 }

    function dragended(d) {
        if (d3.event){
            if (!d3.event.active) ForceSimulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
}

    // Pan and zoom functionality
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));

    
    function zoomed({transform}){
        main_group.attr("transform",transform);
    }
}